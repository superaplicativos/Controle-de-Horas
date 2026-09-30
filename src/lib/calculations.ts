import type { Aula, DuracaoAula, StatusAula, TipoAula, Fechamento } from '@/types';
import { gerarId } from './crypto';

/**
 * Regra de cálculo de valor:
 * - Presença: valor_hora * duracao
 * - Falta: valor_falta fixo (1h, geralmente R$ 35)
 * - Cancelada/Agendada: 0
 */
export function calcularValorAula(
  status: StatusAula,
  duracao: DuracaoAula,
  tipo: TipoAula,
  valorHora: number,
  valorFalta: number
): number {
  if (status === 'presenca') {
    return valorHora * duracao;
  }
  if (status === 'falta') {
    return valorFalta; // sempre 1h, fixo
  }
  return 0; // cancelada ou agendada
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

// Pega YYYY-MM de uma data YYYY-MM-DD
export function mesRefDeData(data: string): string {
  return data.substring(0, 7);
}

export function nomeMes(mesRef: string): string {
  const [ano, mes] = mesRef.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${meses[parseInt(mes) - 1]} ${ano}`;
}

export function nomeMesCurto(mesRef: string): string {
  const [ano, mes] = mesRef.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mes) - 1]}/${ano}`;
}

export function hojeISO(): string {
  const hoje = new Date();
  const tz = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - tz).toISOString().split('T')[0];
}

export function mesAtualRef(): string {
  return mesRefDeData(hojeISO());
}

export function mesAnteriorRef(mesRef: string): string {
  const [ano, mes] = mesRef.split('-').map(Number);
  const d = new Date(ano, mes - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function diasDoMes(mesRef: string): number {
  const [ano, mes] = mesRef.split('-').map(Number);
  return new Date(ano, mes, 0).getDate();
}

export function diaDaSemana(dataISO: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const d = new Date(dataISO + 'T00:00:00');
  return dias[d.getDay()];
}

export interface ResumoMes {
  totalAulas: number;
  totalHoras: number;
  totalGanhos: number;
  totalFaltas: number;
  totalPresencas: number;
  totalCanceladas: number;
  totalAgendadas: number;
  aulasPorDia: { dia: number; total: number; horas: number; valor: number }[];
  aulasPorStatus: { status: string; total: number }[];
  topAlunos: { nome: string; valor: number; aulas: number }[];
  ganhosPorSemana: { semana: string; valor: number }[];
  horasAcumuladas: { dia: number; horas: number }[];
}

export function calcularResumoMes(aulas: Aula[]): ResumoMes {
  const totalAulas = aulas.length;
  const totalHoras = aulas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);
  const totalGanhos = aulas.reduce((s, a) => s + a.valor, 0);
  const totalFaltas = aulas.filter((a) => a.status === 'falta').length;
  const totalPresencas = aulas.filter((a) => a.status === 'presenca').length;
  const totalCanceladas = aulas.filter((a) => a.status === 'cancelada').length;
  const totalAgendadas = aulas.filter((a) => a.status === 'agendada').length;

  // Aulas por dia
  const diaMap = new Map<number, { total: number; horas: number; valor: number }>();
  for (const a of aulas) {
    const dia = parseInt(a.data.split('-')[2]);
    const cur = diaMap.get(dia) || { total: 0, horas: 0, valor: 0 };
    cur.total += 1;
    cur.horas += a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0;
    cur.valor += a.valor;
    diaMap.set(dia, cur);
  }
  const aulasPorDia = Array.from(diaMap.entries())
    .map(([dia, v]) => ({ dia, ...v }))
    .sort((a, b) => a.dia - b.dia);

  // Status distribution
  const statusMap = new Map<string, number>();
  for (const a of aulas) {
    statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1);
  }
  const aulasPorStatus = Array.from(statusMap.entries()).map(([status, total]) => ({ status, total }));

  // Top alunos
  const alunoMap = new Map<string, { valor: number; aulas: number }>();
  for (const a of aulas) {
    const cur = alunoMap.get(a.aluno_nome) || { valor: 0, aulas: 0 };
    cur.valor += a.valor;
    cur.aulas += 1;
    alunoMap.set(a.aluno_nome, cur);
  }
  const topAlunos = Array.from(alunoMap.entries())
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // Ganhos por semana
  const semanaMap = new Map<string, number>();
  for (const a of aulas) {
    const [ano, mes, dia] = a.data.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    const semana = Math.ceil(d.getDate() / 7);
    const key = `Sem ${semana}`;
    semanaMap.set(key, (semanaMap.get(key) || 0) + a.valor);
  }
  const ganhosPorSemana = Array.from(semanaMap.entries())
    .map(([semana, valor]) => ({ semana, valor }))
    .sort((a, b) => parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1]));

  // Horas acumuladas
  let acumulado = 0;
  const horasAcumuladas = aulasPorDia.map((d) => {
    acumulado += d.horas;
    return { dia: d.dia, horas: acumulado };
  });

  return {
    totalAulas,
    totalHoras,
    totalGanhos,
    totalFaltas,
    totalPresencas,
    totalCanceladas,
    totalAgendadas,
    aulasPorDia,
    aulasPorStatus,
    topAlunos,
    ganhosPorSemana,
    horasAcumuladas,
  };
}

export async function criarFechamento(
  professorId: string,
  mesRef: string,
  aulas: Aula[]
): Promise<Fechamento> {
  const resumo = calcularResumoMes(aulas);
  return {
    id: gerarId(),
    professor_id: professorId,
    mes: mesRef,
    total_aulas: resumo.totalAulas,
    total_horas: resumo.totalHoras,
    total_ganhos: resumo.totalGanhos,
    total_faltas: resumo.totalFaltas,
    total_presencas: resumo.totalPresencas,
    snapshot_json: JSON.stringify(aulas, null, 2),
    fechado_em: Date.now(),
  };
}
