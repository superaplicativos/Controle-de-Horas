/**
 * Sync SIMPLIFICADO.
 *
 * - puxarDoGitHub: CLEAR local → importa do GitHub (full replace, não mergeia)
 * - enviarParaGitHub: pega tudo do local → envia pro GitHub (full replace)
 * - notificarAlteracao: debounce 3s → enviarParaGitHub
 *
 * Sem D1, sem merge, sem diff, sem auto-reload, sem loop.
 */

import type { Professor } from '@/types';
import { sincronizarDoGitHub, sincronizarParaGitHub } from './github';

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

export async function puxarDoGitHub(professor: Professor): Promise<SyncState> {
  setState({ status: 'syncing', erro: null });
  try {
    const result = await sincronizarDoGitHub(professor);
    if (result.ok) {
      setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: result.aulasImportadas || 0 });
    } else {
      setState({ status: 'error', erro: result.erro || 'Erro' });
    }
  } catch (e: any) {
    setState({ status: 'error', erro: e.message });
  }
  return currentState;
}

export async function enviarParaGitHub(professor: Professor): Promise<SyncState> {
  setState({ status: 'syncing', erro: null });
  try {
    const result = await sincronizarParaGitHub(professor);
    if (result.ok) {
      setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: 0 });
    } else {
      setState({ status: 'error', erro: result.erro || 'Erro' });
    }
  } catch (e: any) {
    setState({ status: 'error', erro: e.message });
  }
  return currentState;
}

export function notificarAlteracao(professor: Professor) {
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
