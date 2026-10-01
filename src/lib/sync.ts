/**
 * Sistema de sincronização com Cloudflare D1.
 *
 * D1 é um banco de dados SQL de verdade — não precisa de merge complexo.
 * O Worker faz "full replace" (apaga tudo e insere de novo).
 *
 * Fluxo:
 * 1. Ao montar: ENVIAR dados locais pro D1 (protege dados do usuário) → PUXAR do D1 (atualiza cache)
 * 2. Ao alterar: debounce 2s → ENVIAR pro D1
 */

import type { Professor } from '@/types';
import { puxarDoCloud, enviarParaCloud } from './api';

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

function setState(s: Partial<SyncState>) {
  currentState = { ...currentState, ...s };
  notify();
}

export function subscribeSyncState(listener: (s: SyncState) => void) {
  listeners.push(listener);
  listener(currentState);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function notificarDadosAtualizados() {
  setState({ status: 'synced', ultimoSync: Date.now(), erro: null, aulasSincronizadas: 0 });
}

// Listeners para config (sempre true agora — sync é automático)
let configListeners: Array<(configured: boolean) => void> = [];
export function subscribeConfigState(listener: (configured: boolean) => void) {
  configListeners.push(listener);
  return () => { configListeners = configListeners.filter((l) => l !== listener); };
}
export function notifyConfigChanged(configured: boolean) {
  for (const l of configListeners) l(configured);
}

/**
 * Puxa dados do D1 e salva no IndexedDB (cache local).
 */
export async function puxarDoGitHub(professor: Professor): Promise<SyncState> {
  setState({ status: 'syncing', erro: null });
  try {
    const result = await puxarDoCloud(professor);
    if (result.ok) {
      setState({
        status: 'synced',
        ultimoSync: Date.now(),
        erro: null,
        aulasSincronizadas: result.alteracoes,
      });
    } else {
      setState({ status: 'error', erro: result.erro || 'Erro ao puxar dados' });
    }
    return currentState;
  } catch (e: any) {
    setState({ status: 'error', erro: e.message });
    return currentState;
  }
}

/**
 * Envia dados locais (IndexedDB) pro D1.
 */
export async function enviarParaGitHub(professor: Professor): Promise<SyncState> {
  setState({ status: 'syncing', erro: null });
  try {
    const result = await enviarParaCloud(professor);
    if (result.ok) {
      setState({
        status: 'synced',
        ultimoSync: Date.now(),
        erro: null,
        aulasSincronizadas: 0,
      });
    } else {
      setState({ status: 'error', erro: result.erro || 'Erro ao enviar dados' });
    }
    return currentState;
  } catch (e: any) {
    setState({ status: 'error', erro: e.message });
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
      await enviarParaCloud(professor);
    } catch (e) {
      console.error('Erro no auto-sync:', e);
    }
  }, 2000);
}

/**
 * Sincronização completa (pull + push).
 */
export async function sincronizarTudo(professor: Professor): Promise<SyncState> {
  // 1. Envia primeiro (protege dados locais)
  await enviarParaGitHub(professor);
  // 2. Puxa (atualiza cache com dados do D1)
  await puxarDoGitHub(professor);
  return currentState;
}

// Inicializa sync state
setState({ status: 'synced', ultimoSync: null, erro: null });
