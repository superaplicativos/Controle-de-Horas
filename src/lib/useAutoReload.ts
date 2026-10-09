'use client';

import { useEffect, useRef } from 'react';
import { subscribeSyncState } from './sync';

/**
 * Recarrega os dados da página em dois casos:
 *
 * 1. Quando o sync termina (status vira 'synced'). Isso faz a tela reler o
 *    IndexedDB depois que um pull trouxe dados novos da nuvem.
 * 2. Quando a aba volta a ser visível (visibilitychange -> visible).
 *    Garante que ao voltar pro app os dados estejam atualizados.
 *
 * Antes este hook era um no-op, e as telas mostravam dados velhos
 * mesmo depois do sync ter trazido dados novos.
 */
export function useAutoReload(carregar: () => void | Promise<void>) {
  const carregarRef = useRef(carregar);
  // Atualiza o ref dentro de um effect (não durante o render).
  useEffect(() => {
    carregarRef.current = carregar;
  }, [carregar]);

  // Recarrega quando o sync termina.
  useEffect(() => {
    let ultimoStatus = '';
    const unsub = subscribeSyncState((s) => {
      if (s.status === 'synced' && ultimoStatus !== 'synced') {
        carregarRef.current();
      }
      ultimoStatus = s.status;
    });
    return unsub;
  }, []);

  // Recarrega quando a aba volta a ser visível.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        carregarRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);
}
