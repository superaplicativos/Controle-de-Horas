'use client';

import { useEffect, useRef } from 'react';
import { subscribeSyncState, type SyncState } from './sync';

/**
 * Hook MINIMAL: só recarrega dados quando o sync completa E mudou de 'syncing' pra 'synced'.
 * Não escuta focus, visibilitychange, nem nada que dispare múltiplas vezes.
 * Tem debounce de 2s pra evitar múltiplas chamadas.
 */
export function useAutoReload(carregar: () => void | Promise<void>) {
  const lastStatus = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;

  useEffect(() => {
    const unsub = subscribeSyncState((s: SyncState) => {
      if (s.status === 'synced' && lastStatus.current === 'syncing') {
        lastStatus.current = 'synced';
        // Debounce de 2s — se vier outro sync, cancela o anterior
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          carregarRef.current();
        }, 2000);
      } else if (s.status === 'syncing') {
        lastStatus.current = 'syncing';
      }
    });
    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}
