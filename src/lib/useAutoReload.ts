'use client';

import { useEffect, useRef } from 'react';
import { subscribeSyncState, type SyncState } from './sync';

/**
 * Hook que recarrega os dados quando:
 * - O sync muda para 'synced' (dados novos chegaram do GitHub ou seed completou)
 * - A aba volta a ser visível (usuário voltou pro app)
 * - A janela recebe foco
 *
 * Uso:
 *   useAutoReload(carregar);
 * onde `carregar` é a função que busca dados do IndexedDB.
 */
export function useAutoReload(carregar: () => void | Promise<void>) {
  const lastStatus = useRef<string>('');

  // Recarrega quando o sync muda para 'synced'
  useEffect(() => {
    const unsub = subscribeSyncState((s: SyncState) => {
      if (s.status === 'synced' && lastStatus.current !== 'synced') {
        lastStatus.current = 'synced';
        // Aguarda 500ms pra garantir que o IndexedDB terminou de escrever
        setTimeout(() => carregar(), 500);
      } else if (s.status === 'syncing') {
        lastStatus.current = 'syncing';
      }
    });
    return unsub;
  }, [carregar]);

  // Recarrega quando a aba volta a ser visível
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        carregar();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [carregar]);

  // Recarrega quando a janela recebe foco
  useEffect(() => {
    const handleFocus = () => carregar();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [carregar]);
}
