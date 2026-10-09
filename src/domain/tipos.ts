// Tipos do domínio. Sem React, sem I/O. Puros. (R-12)

export type TipoAula = 'vip' | 'turma';
export type StatusAula = 'presenca' | 'falta' | 'cancelada' | 'agendada';

/** Todo registro persistido tem estes campos. (R-19, seção 6) */
export interface Registro {
  id: string; // crypto.randomUUID()
  atualizadoEm: number; // Date.now() na última alteração
  excluido?: true; // lápide (P-03): nunca remove, marca excluido
}

/** Config é objeto único, não é lista. */
export interface Config {
  nome: string;
  valorHoraCentavos: number; // padrão 3500 (R-21, P-04)
  valorFaltaCentavos: number; // padrão 3500
  atualizadoEm: number;
}

export interface Aluno extends Registro {
  nome: string;
  tipo: TipoAula;
  turmaId?: string;
  ativo: boolean;
}

export interface Turma extends Registro {
  nome: string;
}

export interface Aula extends Registro {
  data: string; // AAAA-MM-DD (P-05, R-26)
  horario?: string; // HH:MM
  tipo: TipoAula;
  alunoId?: string;
  turmaId?: string;
  alunoNome: string; // copiado no momento do registro
  duracaoMin: number;
  status: StatusAula;
  conteudo?: string;
  valorCentavos: number; // calculado ao salvar (R-22, P-04)
  mesRef: string; // AAAA-MM, derivado de data
}

export interface CronogramaItem extends Registro {
  data: string;
  horario?: string;
  titulo: string;
  alunoNome?: string;
  duracaoMin?: number;
  observacao?: string;
}

export interface Fechamento extends Registro {
  mesRef: string;
  totalAulas: number;
  totalMinutos: number;
  totalCentavos: number;
  totalFaltas: number;
  totalPresencas: number;
  fechadoEm: number;
}

/** Estado completo persistido. (R-19) */
export interface Estado {
  versaoFormato: number;
  config: Config;
  alunos: Aluno[];
  turmas: Turma[];
  aulas: Aula[];
  cronograma: CronogramaItem[];
  fechamentos: Fechamento[];
}

export const VERSAO_FORMATO_ATUAL = 1;

export function estadoVazio(): Estado {
  return {
    versaoFormato: VERSAO_FORMATO_ATUAL,
    config: {
      nome: 'Professor',
      valorHoraCentavos: 3500,
      valorFaltaCentavos: 3500,
      atualizadoEm: Date.now(),
    },
    alunos: [],
    turmas: [],
    aulas: [],
    cronograma: [],
    fechamentos: [],
  };
}
