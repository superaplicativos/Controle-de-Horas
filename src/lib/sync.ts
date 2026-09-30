/**
 * Sistema de sincronização inteligente:
 * - Auto-pull ao abrir o app (se config GitHub ativa)
 * - Auto-push (debounced) após qualquer alteração
 * - Resolução de conflitos por `criado_em` (mais recente ganha)
 * - Indicador visual de status
 */

import type { Professor, Aula, Aluno, Turma, Fechamento, CronogramaItem, Config } from '@/types';
import { salvarAula, salvarAluno, salvarTurma, salvarFechamento, salvarCronogramaItem, listarAulasPorProfessor, listarAlunosPorProfessor, listarTurmasPorProfessor, listarFechamentosPorProfessor, listarCronogramaPorProfessor, getConfig, salvarConfig } from './db';
import { gerarBackupTXT, parseBackupTXT, lerBackupDoGitHub, salvarBackupNoGitHub } from './github';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'not-configured';

export interface SyncState {
  status: SyncStatus;
  ultimoSync: number | null;
  erro: string | null;
  aulasSincronizadas: number;
}

let listeners: Array<(s: SyncState) => void> = [];
let currentState: SyncState = {
  status: 'idle',
  ultimoSync: null,
  erro: null,
  aulasSincronizadas: 0,
};

let debounceTimer: NodeJS.Timeout | null = null;

function notify() {
  for (const l of listeners) {
    l(currentState);
  }
}

export function subscribeSyncState(listener: (s: SyncState) => void) {
  listeners.push(listener);
  listener(currentState);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setState(s: Partial<SyncState>) {
  currentState = { ...currentState, ...s };
  notify();
}

/**
 * Força um "synced" state (usado após seed completar, pra triggerar reload das páginas).
 */
export function notificarDadosAtualizados() {
  setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: 0 });
}

// Listeners para quando o config do GitHub muda (pra atualizar o indicador)
let configListeners: Array<(configured: boolean) => void> = [];

export function subscribeConfigState(listener: (configured: boolean) => void) {
  configListeners.push(listener);
  return () => {
    configListeners = configListeners.filter((l) => l !== listener);
  };
}

export function notifyConfigChanged(configured: boolean) {
  for (const l of configListeners) {
    l(configured);
  }
}

/**
 * Puxa dados do GitHub e mescla com o local (mais recente ganha).
 * Não sobrescreve dados locais mais novos.
 * Usa o `username` do professor para identificar quais dados pertencem a ele
 * (mesmo que o professor_id remoto seja diferente do local — caso de multi-dispositivo).
 */
export async function puxarDoGitHub(professor: Professor): Promise<SyncState> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    setState({ status: 'not-configured', erro: null });
    return currentState;
  }

  setState({ status: 'syncing', erro: null });

  try {
    const resultado = await lerBackupDoGitHub();
    if (!resultado) {
      // Arquivo não existe ainda
      const novoConfig = { ...config, ultimo_sync: Date.now() };
      await salvarConfig(novoConfig);
      setState({ status: 'synced', ultimoSync: Date.now(), erro: null });
      return currentState;
    }

    const backup = parseBackupTXT(resultado.conteudo);
    if (!backup) {
      setState({ status: 'error', erro: 'Formato inválido no backup remoto' });
      return currentState;
    }

    const professorId = professor.id;
    const professorUsername = professor.username;

    // Dados locais
    const locaisAulas = await listarAulasPorProfessor(professorId);
    const locaisAlunos = await listarAlunosPorProfessor(professorId);
    const locaisTurmas = await listarTurmasPorProfessor(professorId);
    const locaisCronograma = await listarCronogramaPorProfessor(professorId);

    // Mapas por ID (locais)
    const aulasMap = new Map<string, Aula>();
    const alunosMap = new Map<string, Aluno>();
    const turmasMap = new Map<string, Turma>();
    const cronogramaMap = new Map<string, CronogramaItem>();

    for (const a of locaisAulas) aulasMap.set(a.id, a);
    for (const a of locaisAlunos) alunosMap.set(a.id, a);
    for (const t of locaisTurmas) turmasMap.set(t.id, t);
    for (const c of locaisCronograma) cronogramaMap.set(c.id, c);

    // Mescla com remotos: adaptar professor_id (pode ser diferente em multi-dispositivo)
    // Critério: se o backup.professor.username === professor.username, os dados são deste professor.
    const isFromThisProfessor = backup.professor.username === professorUsername;

    let alteracoes = 0;
    if (isFromThisProfessor) {
      // Mapas por nome também (pra evitar duplicação quando o ID muda entre dispositivos)
      const alunosPorNome = new Map<string, Aluno>();
      for (const a of locaisAlunos) alunosPorNome.set(a.nome.toLowerCase(), a);
      const turmasPorNome = new Map<string, Turma>();
      for (const t of locaisTurmas) turmasPorNome.set(t.nome.toLowerCase(), t);
      const aulasPorKey = new Map<string, Aula>();
      for (const a of locaisAulas) aulasPorKey.set(`${a.data}|${a.aluno_nome}|${a.horario}`, a);
      const cronPorKey = new Map<string, CronogramaItem>();
      for (const c of locaisCronograma) cronPorKey.set(`${c.data}|${c.aluno_nome}|${c.horario}`, c);

      for (const a of backup.alunos) {
        const localById = alunosMap.get(a.id);
        const localByName = alunosPorNome.get(a.nome.toLowerCase());
        const alunoAdaptado = { ...a, professor_id: professorId };
        if (!localById && !localByName) {
          // Novo aluno — salvar
          await salvarAluno(alunoAdaptado);
          alteracoes++;
        } else if (localById && a.criado_em > localById.criado_em) {
          // Mesmo ID, remoto mais recente — atualizar
          await salvarAluno(alunoAdaptado);
          alteracoes++;
        }
        // Se localByName existe mas com ID diferente, ignoramos (já temos)
      }
      for (const t of backup.turmas) {
        const localById = turmasMap.get(t.id);
        const localByName = turmasPorNome.get(t.nome.toLowerCase());
        const turmaAdaptada = { ...t, professor_id: professorId };
        if (!localById && !localByName) {
          await salvarTurma(turmaAdaptada);
          alteracoes++;
        } else if (localById && t.criado_em > localById.criado_em) {
          await salvarTurma(turmaAdaptada);
          alteracoes++;
        }
      }
      for (const a of backup.aulas) {
        const localById = aulasMap.get(a.id);
        const localByKey = aulasPorKey.get(`${a.data}|${a.aluno_nome}|${a.horario}`);
        const aulaAdaptada = { ...a, professor_id: professorId };
        if (!localById && !localByKey) {
          await salvarAula(aulaAdaptada);
          alteracoes++;
        } else if (localById && a.criado_em > localById.criado_em) {
          await salvarAula(aulaAdaptada);
          alteracoes++;
        }
      }
      const backupCronograma = (backup.cronograma || []) as CronogramaItem[];
      for (const c of backupCronograma) {
        const localById = cronogramaMap.get(c.id);
        const localByKey = cronPorKey.get(`${c.data}|${c.aluno_nome}|${c.horario}`);
        const cronAdaptado = { ...c, professor_id: professorId };
        if (!localById && !localByKey) {
          await salvarCronogramaItem(cronAdaptado);
          alteracoes++;
        } else if (localById && c.criado_em > localById.criado_em) {
          await salvarCronogramaItem(cronAdaptado);
          alteracoes++;
        }
      }
    }

    const novoConfig = { ...config, ultimo_sync: Date.now() };
    await salvarConfig(novoConfig);

    setState({
      status: 'synced',
      ultimoSync: Date.now(),
      erro: null,
      aulasSincronizadas: alteracoes,
    });
    return currentState;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    setState({ status: 'error', erro: msg });
    return currentState;
  }
}

/**
 * Envia dados locais pro GitHub (debounced para não floodar).
 */
export async function enviarParaGitHub(professor: Professor): Promise<SyncState> {
  const config = await getConfig();
  if (!config?.github_token || !config?.github_repo) {
    setState({ status: 'not-configured', erro: null });
    return currentState;
  }

  setState({ status: 'syncing', erro: null });

  try {
    const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
      listarAulasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
      listarTurmasPorProfessor(professor.id),
      listarFechamentosPorProfessor(professor.id),
      listarCronogramaPorProfessor(professor.id),
    ]);

    // Lê backup atual do GitHub pra mesclar com outros professores
    let shaAntigo: string | undefined;
    let backupAtual = null;
    try {
      const resultado = await lerBackupDoGitHub();
      if (resultado) {
        shaAntigo = resultado.sha;
        backupAtual = parseBackupTXT(resultado.conteudo);
      }
    } catch {
      // ignore
    }

    // Mescla mantendo dados de outros professores
    const aulasFinal = [
      ...(backupAtual?.aulas.filter((a: Aula) => a.professor_id !== professor.id) || []),
      ...aulas,
    ];
    const alunosFinal = [
      ...(backupAtual?.alunos.filter((a: Aluno) => a.professor_id !== professor.id) || []),
      ...alunos,
    ];
    const turmasFinal = [
      ...(backupAtual?.turmas.filter((t: Turma) => t.professor_id !== professor.id) || []),
      ...turmas,
    ];
    const fechamentosFinal = [
      ...(backupAtual?.fechamentos.filter((f: Fechamento) => f.professor_id !== professor.id) || []),
      ...fechamentos,
    ];
    const cronogramaFinal = [
      ...((backupAtual?.cronograma || []).filter((c: CronogramaItem) => c.professor_id !== professor.id)),
      ...cronograma,
    ];

    const backupTXT = {
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

    const conteudo = gerarBackupTXT(backupTXT);
    await salvarBackupNoGitHub(conteudo, shaAntigo);

    const novoConfig = { ...config, ultimo_sync: Date.now() };
    await salvarConfig(novoConfig);

    setState({
      status: 'synced',
      ultimoSync: Date.now(),
      erro: null,
      aulasSincronizadas: aulas.length,
    });
    return currentState;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    setState({ status: 'error', erro: msg });
    return currentState;
  }
}

/**
 * Marca que houve alteração local — agenda sync automático (debounced).
 */
export function notificarAlteracao(professor: Professor) {
  if (debounceTimer) clearTimeout(debounceTimer);
  setState({ status: 'syncing', erro: null });
  debounceTimer = setTimeout(async () => {
    try {
      await enviarParaGitHub(professor);
    } catch (e) {
      console.error('Erro no auto-sync:', e);
    }
  }, 2000);
}

/**
 * Sincronização completa (pull + push).
 */
export async function sincronizarTudo(professor: Professor): Promise<SyncState> {
  // 1. Puxa dados remotos
  await puxarDoGitHub(professor);
  // 2. Envia dados mesclados
  await enviarParaGitHub(professor);
  return currentState;
}

export async function getConfigSync(): Promise<Config | null> {
  return getConfig();
}
