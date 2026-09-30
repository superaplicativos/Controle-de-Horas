'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { subscribeSyncState, puxarDoGitHub, notificarAlteracao, type SyncState, type SyncStatus } from './sync';

const DEFAULT_STATE: SyncState = {
  status: 'idle',
  ultimoSync: null,
  erro: null,
  aulasSincronizadas: 0,
};

export function useSync() {
  const { professor } = useAuth();
  const [state, setState] = useState<SyncState>(DEFAULT_STATE);

  useEffect(() => {
    const unsubscribe = subscribeSyncState(setState);
    return unsubscribe;
  }, []);

  // Auto-pull ao montar (se professor logado)
  useEffect(() => {
    if (!professor) return;
    let mounted = true;
    (async () => {
      const s = await puxarDoGitHub(professor.id);
      if (!mounted) return;
      setState(s);
    })();
    return () => { mounted = false; };
  }, [professor]);

  function notificar() {
    if (!professor) return;
    notificarAlteracao(professor);
  }

  return {
    status: state.status as SyncStatus,
    ultimoSync: state.ultimoSync,
    erro: state.erro,
    aulasSincronizadas: state.aulasSincronizadas,
    notificar,
  };
}
