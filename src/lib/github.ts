import type { Aula, Aluno, Turma, Fechamento, Professor, BackupTXT, Config, CronogramaItem } from '@/types';
import { salvarAula, salvarAluno, salvarTurma, salvarFechamento, salvarCronogramaItem, listarAulasPorProfessor, listarAlunosPorProfessor, listarTurmasPorProfessor, listarFechamentosPorProfessor, listarCronogramaPorProfessor } from './db';

/**
 * Configurações FIXAS do sync (não pede mais nada do usuário).
 *
 * Como funciona:
 * - ESCRITA: POST /sync no Cloudflare Worker
 * - LEITURA: GET /backup no Cloudflare Worker (também usa token GitHub, evita rate limit)
 */

const WORKER_URL = 'https://controle-aulas-sync.control-de-horas.workers.dev';
const API_SECRET = 'controle-aulas-2026-emerald';
const BACKUP_PATH = 'data/backup.txt';

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
 * Lê o arquivo data/backup.txt via Cloudflare Worker.
 * O Worker tem o token GitHub embutido — não sofre com rate limit.
 */
export async function lerBackupDoGitHub(): Promise<{ conteudo: string; sha: string } | null> {
  const resp = await fetch(`${WORKER_URL}/backup`, {
    headers: {
      'Authorization': `Bearer ${API_SECRET}`,
      'Accept': 'application/json',
    },
  });

  if (resp.status === 404) {
    return null;
  }
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(`Worker GET /backup: ${resp.status} - ${errData?.error || resp.statusText}`);
  }

  const data = await resp.json();
  if (!data.exists) {
    return null;
  }
  return { conteudo: data.content, sha: data.sha };
}

/**
 * Salva/atualiza o arquivo data/backup.txt via Cloudflare Worker.
 */
export async function salvarBackupNoGitHub(conteudo: string): Promise<boolean> {
  const resp = await fetch(`${WORKER_URL}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: conteudo,
      branch: 'main',
    }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(`Worker POST /sync: ${resp.status} - ${errData?.error || resp.statusText}`);
  }

  return true;
}

/**
 * Sincroniza do GitHub -> IndexedDB
 */
export async function sincronizarDoGitHub(professor: Professor): Promise<SyncResult> {
  try {
    const resultado = await lerBackupDoGitHub();
    if (!resultado) {
      return { ok: true, aulasImportadas: 0, deOnde: 'Arquivo não existe ainda' };
    }

    const backup = parseBackupTXT(resultado.conteudo);
    if (!backup) {
      return { ok: false, erro: 'Formato inválido' };
    }

    // Só importa se for deste professor
    if (backup.professor.username !== professor.username) {
      return { ok: true, aulasImportadas: 0, deOnde: 'Backup é de outro professor' };
    }

    const professorId = professor.id;

    // FULL REPLACE: limpa tudo local antes de importar
    const { limparDadosProfessor } = await import('./db');
    await limparDadosProfessor(professorId);

    // Importa tudo do backup (adaptando professor_id)
    let total = 0;

    for (const a of backup.alunos) {
      await salvarAluno({ ...a, professor_id: professorId });
      total++;
    }
    for (const t of backup.turmas) {
      await salvarTurma({ ...t, professor_id: professorId });
      total++;
    }
    for (const a of backup.aulas) {
      await salvarAula({ ...a, professor_id: professorId });
      total++;
    }
    for (const c of (backup.cronograma || [])) {
      await salvarCronogramaItem({ ...c, professor_id: professorId });
      total++;
    }
    for (const f of backup.fechamentos) {
      await salvarFechamento({ ...f, professor_id: professorId });
      total++;
    }

    return {
      ok: true,
      aulasImportadas: backup.aulas.length,
      alunosImportados: backup.alunos.length,
      turmasImportadas: backup.turmas.length,
      fechamentosImportados: backup.fechamentos.length,
      deOnde: 'GitHub (full replace)',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro';
    return { ok: false, erro: msg };
  }
}

/**
 * Sincroniza do IndexedDB -> GitHub (via Worker)
 */
export async function sincronizarParaGitHub(professor: Professor): Promise<SyncResult> {
  try {
    const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
      listarAulasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
      listarTurmasPorProfessor(professor.id),
      listarFechamentosPorProfessor(professor.id),
      listarCronogramaPorProfessor(professor.id),
    ]);

    // Lê backup atual do GitHub pra mesclar com outros professores
    let backupAtual: BackupTXT | null = null;
    try {
      const resultado = await lerBackupDoGitHub();
      if (resultado) {
        backupAtual = parseBackupTXT(resultado.conteudo);
      }
    } catch {
      // ignore
    }

    // Mescla: substitui dados deste professor, mantém dos outros
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
    await salvarBackupNoGitHub(conteudo);

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
  const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as BackupTXT;
  } catch {
    return null;
  }
}

// Mantém compatibilidade (não usado mais, mas evita quebrar imports)
export async function getConfig(): Promise<Config | null> {
  return {
    github_token: '***worker-managed***',
    github_repo: 'superaplicativos/Controle-de-Horas',
    github_branch: 'main',
    ultimo_sync: null,
    auto_sync: true,
  };
}

export async function salvarConfig(_config: Config): Promise<void> {
  // Não faz mais nada — config é hardcoded
}

export async function configurarGitHub(_token: string, _repo: string, _branch: string): Promise<void> {
  // Não faz mais nada — config é hardcoded no Worker
}

export async function lerConfigLocal(): Promise<Config | null> {
  return getConfig();
}
