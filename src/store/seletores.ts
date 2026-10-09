// Seletores puros. (R-30: telas leem por seletores.)
//
// ATENÇÃO: seletores que filtram criam array novo a cada chamada.
// Zustand v5 usa useSyncExternalStore que compara com Object.is.
// Array novo ≠ array anterior = loop infinito.
//
// Use o hook useStoreShallow (abaixo) em vez de useStore(seletor) para
// seletores que retornam arrays ou objetos derivados.

import { useShallow } from 'zustand/react/shallow';
import { useStore, type StoreComMeta } from './store';
import type { Aluno, Turma, Aula, CronogramaItem } from '../domain/tipos';

/** Hook que aplica useShallow automaticamente, evitando loops infinitos. */
export function useStoreShallow<T>(seletor: (s: StoreComMeta) => T): T {
  return useStore(useShallow(seletor));
}

export function alunosVisiveis(s: StoreComMeta): Aluno[] {
  return s.alunos.filter((a) => !a.excluido);
}

export function alunosAtivos(s: StoreComMeta): Aluno[] {
  return s.alunos.filter((a) => !a.excluido && a.ativo);
}

export function alunosVip(s: StoreComMeta): Aluno[] {
  return s.alunos.filter((a) => !a.excluido && a.tipo === 'vip');
}

export function turmasVisiveis(s: StoreComMeta): Turma[] {
  return s.turmas.filter((t) => !t.excluido);
}

export function aulasVisiveis(s: StoreComMeta): Aula[] {
  return s.aulas.filter((a) => !a.excluido);
}

export function aulasDoMes(s: StoreComMeta, mesRef: string): Aula[] {
  return s.aulas.filter((a) => !a.excluido && a.mesRef === mesRef);
}

export function cronogramaVisivel(s: StoreComMeta): CronogramaItem[] {
  return s.cronograma.filter((c) => !c.excluido);
}

export function mesesComAulas(s: StoreComMeta): string[] {
  const set = new Set<string>();
  for (const a of s.aulas) {
    if (!a.excluido) set.add(a.mesRef);
  }
  return Array.from(set).sort();
}
