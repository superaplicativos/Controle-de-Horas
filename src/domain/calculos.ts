// Cálculos puros. Sem React, sem I/O. (R-12, R-21)
import type { StatusAula } from './tipos';

/**
 * Calcula o valor de uma aula em centavos. (R-21, P-04)
 *
 * - Presença: Math.round(valorHoraCentavos * duracaoMin / 60)
 * - Falta: valorFaltaCentavos fixo, contando como 60 minutos
 * - Cancelada e agendada: 0 e não contam horas
 */
export function calcularValorAulaCentavos(
  status: StatusAula,
  duracaoMin: number,
  valorHoraCentavos: number,
  valorFaltaCentavos: number,
): number {
  if (status === 'presenca') {
    return Math.round((valorHoraCentavos * duracaoMin) / 60);
  }
  if (status === 'falta') {
    return valorFaltaCentavos;
  }
  return 0; // cancelada ou agendada
}

/**
 * Minutos que contam para o total de horas do mês. (R-23)
 * - Presença: duração real
 * - Falta: 60 minutos fixos
 * - Cancelada e agendada: 0
 */
export function minutosContaveis(status: StatusAula, duracaoMin: number): number {
  if (status === 'presenca') return duracaoMin;
  if (status === 'falta') return 60;
  return 0;
}

export interface ResumoMes {
  totalAulas: number;
  totalMinutos: number;
  totalCentavos: number;
  totalFaltas: number;
  totalPresencas: number;
  totalCanceladas: number;
  totalAgendadas: number;
  valorPorDia: { dia: number; centavos: number }[];
}

import type { Aula } from './tipos';

/**
 * Resumo do mês a partir da lista de aulas. (R-23)
 * Excluídos (lápides) são ignorados.
 */
export function calcularResumoMes(aulas: Aula[]): ResumoMes {
  const vivas = aulas.filter((a) => !a.excluido);

  let totalMinutos = 0;
  let totalCentavos = 0;
  let totalFaltas = 0;
  let totalPresencas = 0;
  let totalCanceladas = 0;
  let totalAgendadas = 0;
  const porDia = new Map<number, number>();

  for (const a of vivas) {
    totalMinutos += minutosContaveis(a.status, a.duracaoMin);
    totalCentavos += a.valorCentavos;
    if (a.status === 'falta') totalFaltas++;
    else if (a.status === 'presenca') totalPresencas++;
    else if (a.status === 'cancelada') totalCanceladas++;
    else if (a.status === 'agendada') totalAgendadas++;

    const dia = parseInt(a.data.slice(8, 10), 10);
    porDia.set(dia, (porDia.get(dia) ?? 0) + a.valorCentavos);
  }

  const valorPorDia = Array.from(porDia.entries())
    .map(([dia, centavos]) => ({ dia, centavos }))
    .sort((a, b) => a.dia - b.dia);

  return {
    totalAulas: vivas.length,
    totalMinutos,
    totalCentavos,
    totalFaltas,
    totalPresencas,
    totalCanceladas,
    totalAgendadas,
    valorPorDia,
  };
}

/**
 * Variação percentual inteira contra o mês anterior. (R-24)
 * Se o anterior for 0, retorna null (a tela mostra "novo").
 */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

/** Formata centavos como moeda BRL. */
export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata minutos como "Xh" ou "XhYY". */
export function formatarMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}
