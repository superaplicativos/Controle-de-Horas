// Store zustand. Única fonte de verdade da interface. (P-01, R-29, R-32)
//
// R-32: o estado é lido de forma síncrona do localStorage antes do primeiro render.
// Não existe tela de carregamento com dados vazios.

import { create } from 'zustand';
import type { Estado } from '../domain/tipos';
import { estadoVazio } from '../domain/tipos';
import { carregarEstado, carregarMeta, type Meta } from '../data/storage';

export interface StoreComMeta extends Estado {
  meta: Meta;
  erroCorrupcao: string | null;
}

function inicializar(): StoreComMeta {
  const meta = carregarMeta();
  try {
    const estado = carregarEstado();
    return { ...estado, meta, erroCorrupcao: null };
  } catch (e) {
    // R-34: não apaga. Mostra erro e abre com estado vazio sem sobrescrever.
    return {
      ...estadoVazio(),
      meta,
      erroCorrupcao: e instanceof Error ? e.message : 'Erro desconhecido ao carregar dados',
    };
  }
}

export const useStore = create<StoreComMeta>(inicializar);

/** Reinicia o store para estado vazio (usado em testes e na recuperação de corrupção). */
export function reiniciar(): void {
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
  useStore.setState({
    ...estadoVazio(),
    meta: { shas: {}, pendentes: [], ultimoSync: null, ultimoErro: null },
    erroCorrupcao: null,
  });
}
