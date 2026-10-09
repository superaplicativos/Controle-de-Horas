/**
 * Sync via Cloudflare Worker + D1 (sem gravar no repositório).
 *
 * - puxarDoGitHub: puxa do D1 e salva no IndexedDB (proteção contra nuvem vazia)
 * - enviarParaGitHub: envia o IndexedDB pro D1 (full replace, transação)
 * - notificarAlteracao: debounce 3s → enviarParaGitHub
 * - sync ao fechar a aba (visibilitychange / pagehide) se houver pendência
 */

import type { Professor } from '@/types';
import { puxarDoCloud, enviarParaCloud, WORKER_URL, API_SECRET } from './api';
import {
  listarAulasPorProfessor,
  listarAlunosPorProfessor,
  listarTurmasPorProfessor,
  listarFechamentosPorProfessor,
  listarCronogramaPorProfessor,
} from './db';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  ultimoSync: number | null;
  erro: string | null;
  aulasSincronizadas: number;
}

let listeners: Array<(s: SyncState) => void> = [];
let currentState: SyncState = { status: 'idle', ultimoSync: null, erro: null, aulasSincronizadas: 0 };
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendenteEnvio = false;
let professorAtivo: Professor | null = null;
// Bloqueia auto-envio até o primeiro pull bem-sucedido.
// Evita que dado velho do IndexedDB seja empurrado pra nuvem
// antes de o local ter sido espelhado a partir do D1.
let pullInicialConcluido = false;

function notify() { for (const l of listeners) l(currentState); }
function setState(s: Partial<SyncState>) { currentState = { ...currentState, ...s }; notify(); }

export function subscribeSyncState(listener: (s: SyncState) => void) {
  listeners.push(listener);
  listener(currentState);
  return () => { listeners = listeners.filter((l) => l !== listener); };
}

export function subscribeConfigState(_listener: (configured: boolean) => void) {
  return () => {};
}
export function notifyConfigChanged(_configured: boolean) {}
export function notificarDadosAtualizados() {}

/**
 * Verifica se a nuvem está vazia para este professor.
 * Em caso de erro, retorna true (trata como vazia para NUNCA apagar local).
 */
async function nuvemVazia(professor: Professor): Promise<boolean> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/dados/${encodeURIComponent(professor.username)}`, {
      headers: { 'Authorization': `Bearer ${API_SECRET}` },
    });
    if (!resp.ok) return true;
    const data = await resp.json();
    if (!data.ok) return true;
    const total = (data.aulas?.length || 0) + (data.alunos?.length || 0) + (data.turmas?.length || 0);
    return total === 0;
  } catch {
    return true;
  }
}

export async function puxarDoGitHub(professor: Professor): Promise<SyncState> {
  professorAtivo = professor;
  setState({ status: 'syncing', erro: null });
  try {
    // Proteção: se a nuvem está vazia e o local tem dados, envia o local primeiro.
    const localTemDados = (await listarAulasPorProfessor(professor.id)).length > 0;
    if (localTemDados) {
      const vazia = await nuvemVazia(professor);
      if (vazia) {
        await enviarParaCloud(professor);
      }
    }
    const result = await puxarDoCloud(professor);
    if (result.ok) {
      setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: result.alteracoes });
      pendenteEnvio = false;
      // Libera o auto-envio: o local agora é espelho da nuvem.
      pullInicialConcluido = true;
    } else {
      // NUNCA apaga dados locais se a resposta vier vazia ou com erro.
      setState({ status: 'error', erro: result.erro || 'Erro ao puxar do banco' });
    }
  } catch (e: any) {
    setState({ status: 'error', erro: e?.message || 'Erro ao puxar do banco' });
  }
  return currentState;
}

export async function enviarParaGitHub(professor: Professor): Promise<SyncState> {
  professorAtivo = professor;
  setState({ status: 'syncing', erro: null });
  try {
    const result = await enviarParaCloud(professor);
    if (result.ok) {
      setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: 0 });
      pendenteEnvio = false;
    } else {
      setState({ status: 'error', erro: result.erro || 'Erro ao enviar ao banco' });
      pendenteEnvio = true;
    }
  } catch (e: any) {
    setState({ status: 'error', erro: e?.message || 'Erro ao enviar ao banco' });
    pendenteEnvio = true;
  }
  return currentState;
}

export function notificarAlteracao(professor: Professor) {
  professorAtivo = professor;
  pendenteEnvio = true;
  // Não envia nada até o primeiro pull ter espelhado o local a partir da nuvem.
  // Isso evita empurrar dado velho do IndexedDB por cima do dado certo do D1.
  if (!pullInicialConcluido) {
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try { await enviarParaGitHub(professor); } catch (e) { console.error('auto-sync:', e); }
  }, 3000);
}

export async function sincronizarTudo(professor: Professor): Promise<SyncState> {
  await enviarParaGitHub(professor);
  await puxarDoGitHub(professor);
  return currentState;
}

// ===== Sync ao fechar a aba / perder conexão =====

async function flushPendencia() {
  if (!pendenteEnvio || !professorAtivo) return;
  // Só envia ao fechar a aba se o pull inicial já tiver concluído.
  // Caso contrário, pode ser dado velho sendo empurrado pra nuvem.
  if (!pullInicialConcluido) return;
  const prof = professorAtivo;
  try {
    const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
      listarAulasPorProfessor(prof.id),
      listarAlunosPorProfessor(prof.id),
      listarTurmasPorProfessor(prof.id),
      listarFechamentosPorProfessor(prof.id),
      listarCronogramaPorProfessor(prof.id),
    ]);
    const body = JSON.stringify({
      alunos: alunos.map(a => ({ ...a, ativo: a.ativo ? 1 : 0 })),
      turmas, aulas, cronograma, fechamentos,
    });
    const url = `${WORKER_URL}/api/dados/${encodeURIComponent(prof.username)}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_SECRET}` },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    console.error('flush pendência:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendencia);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendencia();
  });
  window.addEventListener('online', () => {
    if (pendenteEnvio && professorAtivo && pullInicialConcluido) {
      enviarParaGitHub(professorAtivo);
    }
  });
}
