import type { Aula, Aluno, Turma, Fechamento, Professor, BackupTXT, Config, CronogramaItem } from '@/types';
import { getConfig, salvarConfig, salvarAula, salvarAluno, salvarTurma, salvarFechamento, salvarCronogramaItem, listarAulasPorProfessor, listarAlunosPorProfessor, listarTurmasPorProfessor, listarFechamentosPorProfessor, listarCronogramaPorProfessor } from './db';

const BACKUP_PATH = 'data/backup.txt';
const GITHUB_API = 'https://api.github.com';

export interface SyncResult {
  ok: boolean;
  erro?: string;
  aulasImportadas?: number;
  alunosImportados?: number;
  turmasImportadas?: number;
  fechamentosImportados?: number;
  professoresImportados?: number;
  deOnde?: string;
}

/**
 * Lê o arquivo data/backup.txt do repositório GitHub via API.
 * Retorna o conteúdo bruto + o SHA do arquivo (necessário pra update).
 */
export async function lerBackupDoGitHub(): Promise<{ conteudo: string; sha: string } | null> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    return null;
  }

  const url = `${GITHUB_API}/repos/${config.github_repo}/contents/${BACKUP_PATH}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.github_token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (resp.status === 404) {
    return null; // arquivo ainda não existe
  }
  if (!resp.ok) {
    throw new Error(`GitHub API: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const conteudo = atob(data.content.replace(/\n/g, ''));
  return { conteudo, sha: data.sha };
}

/**
 * Salva/atualiza o arquivo data/backup.txt no repositório GitHub via API.
 */
export async function salvarBackupNoGitHub(conteudo: string, shaAntigo?: string): Promise<boolean> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    throw new Error('GitHub não configurado');
  }

  const url = `${GITHUB_API}/repos/${config.github_repo}/contents/${BACKUP_PATH}`;
  const body: Record<string, unknown> = {
    message: `Backup automático - ${new Date().toISOString()}`,
    content: btoa(unescape(encodeURIComponent(conteudo))),
    branch: config.github_branch || 'main',
  };
  if (shaAntigo) {
    body.sha = shaAntigo;
  }

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.github_token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(`GitHub API: ${resp.status} - ${errData?.message || resp.statusText}`);
  }

  const novoConfig = { ...config, ultimo_sync: Date.now() };
  await salvarConfig(novoConfig);
  return true;
}

/**
 * Sincroniza do GitHub -> IndexedDB
 * Lê o backup.txt e importa todos os dados.
 */
export async function sincronizarDoGitHub(professorId: string): Promise<SyncResult> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    return { ok: false, erro: 'GitHub não configurado' };
  }

  try {
    const resultado = await lerBackupDoGitHub();
    if (!resultado) {
      return { ok: true, aulasImportadas: 0, deOnde: 'Arquivo não existe ainda no repo' };
    }

    const backup = parseBackupTXT(resultado.conteudo);
    if (!backup) {
      return { ok: false, erro: 'Formato inválido' };
    }

    // Importa apenas dados deste professor (filtra por professor_id)
    let aulasN = 0, alunosN = 0, turmasN = 0, fechamentosN = 0, cronogramaN = 0;

    for (const a of backup.aulas) {
      if (a.professor_id === professorId) {
        await salvarAula(a);
        aulasN++;
      }
    }
    for (const a of backup.alunos) {
      if (a.professor_id === professorId) {
        await salvarAluno(a);
        alunosN++;
      }
    }
    for (const t of backup.turmas) {
      if (t.professor_id === professorId) {
        await salvarTurma(t);
        turmasN++;
      }
    }
    for (const f of backup.fechamentos) {
      if (f.professor_id === professorId) {
        await salvarFechamento(f);
        fechamentosN++;
      }
    }
    const backupCronograma = (backup.cronograma || []) as CronogramaItem[];
    for (const c of backupCronograma) {
      if (c.professor_id === professorId) {
        await salvarCronogramaItem(c);
        cronogramaN++;
      }
    }

    const novoConfig = { ...config, ultimo_sync: Date.now() };
    await salvarConfig(novoConfig);

    return {
      ok: true,
      aulasImportadas: aulasN,
      alunosImportados: alunosN,
      turmasImportadas: turmasN,
      fechamentosImportados: fechamentosN,
      deOnde: 'GitHub',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    return { ok: false, erro: msg };
  }
}

/**
 * Sincroniza do IndexedDB -> GitHub
 * Exporta os dados do professor e salva no repo.
 */
export async function sincronizarParaGitHub(professor: Professor): Promise<SyncResult> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    return { ok: false, erro: 'GitHub não configurado' };
  }

  try {
    const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
      listarAulasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
      listarTurmasPorProfessor(professor.id),
      listarFechamentosPorProfessor(professor.id),
      listarCronogramaPorProfessor(professor.id),
    ]);

    // Tenta ler o backup atual do GitHub (pra mesclar com outros professores)
    let backupAtual: BackupTXT | null = null;
    let shaAntigo: string | undefined;
    try {
      const resultado = await lerBackupDoGitHub();
      if (resultado) {
        shaAntigo = resultado.sha;
        backupAtual = parseBackupTXT(resultado.conteudo);
      }
    } catch {
      // ignore
    }

    // Mescla: substitui os dados deste professor, mantém dos outros
    const aulasFinal = [
      ...(backupAtual?.aulas.filter((a) => a.professor_id !== professor.id) || []),
      ...aulas,
    ];
    const alunosFinal = [
      ...(backupAtual?.alunos.filter((a) => a.professor_id !== professor.id) || []),
      ...alunos,
    ];
    const turmasFinal = [
      ...(backupAtual?.turmas.filter((t) => t.professor_id !== professor.id) || []),
      ...turmas,
    ];
    const fechamentosFinal = [
      ...(backupAtual?.fechamentos.filter((f) => f.professor_id !== professor.id) || []),
      ...fechamentos,
    ];
    const cronogramaFinal = [
      ...((backupAtual?.cronograma || []).filter((c) => c.professor_id !== professor.id)),
      ...cronograma,
    ];

    const backup: BackupTXT = {
      versao: 1,
      exportado_em: new Date().toISOString(),
      professor: {
        nome: professor.nome,
        username: professor.username,
        valor_hora: professor.valor_hora,
      },
      aulas: aulasFinal,
      alunos: alunosFinal,
      turmas: turmasFinal,
      fechamentos: fechamentosFinal,
      cronograma: cronogramaFinal,
    };

    const conteudo = gerarBackupTXT(backup);
    await salvarBackupNoGitHub(conteudo, shaAntigo);

    return {
      ok: true,
      aulasImportadas: aulas.length,
      alunosImportados: alunos.length,
      turmasImportadas: turmas.length,
      fechamentosImportados: fechamentos.length,
      deOnde: 'GitHub',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    return { ok: false, erro: msg };
  }
}

// ============ FORMATO TXT ============

export function gerarBackupTXT(backup: BackupTXT): string {
  const linhas: string[] = [];
  linhas.push('========================================');
  linhas.push(' CONTROLE DE AULAS - BACKUP');
  linhas.push(` Exportado em: ${backup.exportado_em}`);
  linhas.push(` Versão: ${backup.versao}`);
  linhas.push('========================================');
  linhas.push('');
  linhas.push(`PROFESSOR: ${backup.professor.nome} (@${backup.professor.username})`);
  linhas.push(`VALOR/HORA: R$ ${backup.professor.valor_hora.toFixed(2)}`);
  linhas.push('');

  linhas.push('----- ALUNOS -----');
  for (const a of backup.alunos) {
    linhas.push(`${a.id} | ${a.nome} | ${a.tipo} | ${a.ativo ? 'ativo' : 'inativo'}`);
  }
  linhas.push('');

  linhas.push('----- TURMAS -----');
  for (const t of backup.turmas) {
    linhas.push(`${t.id} | ${t.nome}`);
  }
  linhas.push('');

  linhas.push('----- AULAS DADAS -----');
  for (const a of backup.aulas) {
    linhas.push(
      `${a.data} | ${a.aluno_nome.padEnd(20).slice(0, 20)} | ${a.horario} | ${a.duracao}h | ${a.status.padEnd(10)} | R$ ${a.valor.toFixed(2)} | ${a.conteudo}`
    );
  }
  linhas.push('');

  linhas.push('----- CRONOGRAMA (PLANEJAMENTO) -----');
  for (const c of (backup.cronograma || [])) {
    linhas.push(`${c.data} | ${c.aluno_nome.padEnd(20).slice(0, 20)} | ${c.horario} | ${c.duracao}h | ${c.titulo} | ${c.observacao}`);
  }
  linhas.push('');

  linhas.push('----- FECHAMENTOS -----');
  for (const f of backup.fechamentos) {
    linhas.push(`${f.mes}: ${f.total_aulas} aulas | ${f.total_horas}h | R$ ${f.total_ganhos.toFixed(2)} | ${f.total_faltas} faltas`);
  }
  linhas.push('');

  linhas.push('----- JSON COMPLETO -----');
  linhas.push(JSON.stringify(backup, null, 2));
  linhas.push('----- FIM -----');

  return linhas.join('\n');
}

export function parseBackupTXT(conteudo: string): BackupTXT | null {
  // Procura o bloco JSON no final do arquivo
  const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as BackupTXT;
  } catch {
    return null;
  }
}

export async function salvarConfigLocal(config: Config): Promise<void> {
  await salvarConfig(config);
}

export async function lerConfigLocal(): Promise<Config | null> {
  return getConfig();
}

export async function configurarGitHub(token: string, repo: string, branch: string): Promise<void> {
  await salvarConfig({
    github_token: token,
    github_repo: repo,
    github_branch: branch,
    ultimo_sync: null,
    auto_sync: true,
  });
}
