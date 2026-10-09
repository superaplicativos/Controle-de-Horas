// Snapshot imutável de um mês fechado. (R-25)
import { calcularResumoMes } from './calculos';
import type { Aula, Fechamento } from './tipos';

/**
 * Cria um Fechamento a partir das aulas do mês. (R-25)
 * O snapshot é imutável — nunca recalculado depois.
 */
export function criarFechamento(mesRef: string, aulas: Aula[]): Fechamento {
  const vivas = aulas.filter((a) => !a.excluido);
  const resumo = calcularResumoMes(vivas);
  return {
    id: crypto.randomUUID(),
    atualizadoEm: Date.now(),
    mesRef,
    totalAulas: resumo.totalAulas,
    totalMinutos: resumo.totalMinutos,
    totalCentavos: resumo.totalCentavos,
    totalFaltas: resumo.totalFaltas,
    totalPresencas: resumo.totalPresencas,
    fechadoEm: Date.now(),
  };
}

/**
 * Verifica se um mês está fechado (tem Fechamento não-excluído).
 */
export function mesFechado(fechamentos: Fechamento[], mesRef: string): Fechamento | undefined {
  return fechamentos.find((f) => !f.excluido && f.mesRef === mesRef);
}

/**
 * Compara totais atuais com snapshot. (R-25)
 * Retorna true se divergem (mostra selo "alterado após fechamento").
 */
export function divergeDoSnapshot(fechamento: Fechamento, aulasAtuais: Aula[]): boolean {
  const vivas = aulasAtuais.filter((a) => !a.excluido);
  const resumo = calcularResumoMes(vivas);
  return (
    resumo.totalAulas !== fechamento.totalAulas ||
    resumo.totalCentavos !== fechamento.totalCentavos ||
    resumo.totalMinutos !== fechamento.totalMinutos
  );
}
