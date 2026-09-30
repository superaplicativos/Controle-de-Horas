'use client';

import { useEffect, useRef } from 'react';
import { subscribeSyncState, type SyncState } from './sync';

/**
 * Hook que recarrega os dados (sem refresh da página) quando:
 * - O sync completa (dados novos chegaram do GitHub)
 *
 * NÃO recarrega em visibilitychange ou focus (causava piscar a tela no mobile).
 * O usuário pode forçar reload manualmente com o botão de refresh.
 */
export function useAutoReload(carregar: () => void | Promise<void>) {
  const lastStatus = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = subscribeSyncState((s: SyncState) => {
      if (s.status === 'synced' && lastStatus.current !== 'synced') {
        lastStatus.current = 'synced';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => carregar(), 500);
      } else if (s.status === 'syncing') {
        lastStatus.current = 'syncing';
      }
    });
    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [carregar]);
}
