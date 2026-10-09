// Tipos centrais do sistema

export type TipoAula = 'vip' | 'turma';
export type StatusAula = 'presenca' | 'falta' | 'cancelada' | 'agendada';
export type DuracaoAula = 1 | 1.5 | 2;

export interface Professor {
  id: string;
  username: string;
  senha_hash?: string;
  salt?: string;
  nome: string;
  valor_hora: number;
  valor_falta: number;
  criado_em: number;
  // Controle de assinatura Mercado Pago
  assinatura_status: 'free_trial' | 'active' | 'cancelled' | 'blocked' | 'lifetime';
  assinatura_id?: string; // preapproval_id do Mercado Pago
  trial_fim?: number; // timestamp de fim do trial (7 dias)
  bloqueado?: boolean; // admin pode bloquear manualmente
  // Admin
  is_admin?: boolean;
}

export interface SincronizacaoProfessor {
  username: string;
  assinatura_status: string;
  assinatura_id?: string;
  trial_fim?: number;
  bloqueado?: boolean;
}

export interface Aluno {
  id: string;
  professor_id: string;
  nome: string;
  tipo: TipoAula;
  turma_id: string | null;
  ativo: boolean;
  criado_em: number;
}

export interface Turma {
  id: string;
  professor_id: string;
  nome: string;
  criado_em: number;
}

export interface Aula {
  id: string;
  professor_id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_tipo: TipoAula;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  duracao: DuracaoAula;
  status: StatusAula;
  conteudo: string;
  valor: number;
  mes_ref: string; // YYYY-MM
  criado_em: number;
}

export interface Fechamento {
  id: string;
  professor_id: string;
  mes: string;
  total_aulas: number;
  total_horas: number;
  total_ganhos: number;
  total_faltas: number;
  total_presencas: number;
  snapshot_json: string;
  fechado_em: number;
}

export interface Config {
  github_token: string;
  github_repo: string;
  github_branch: string;
  ultimo_sync: number | null;
  auto_sync: boolean;
}

export interface CronogramaItem {
  id: string;
  professor_id: string;
  titulo: string;
  aluno_nome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  duracao: 1 | 1.5 | 2;
  observacao: string;
  criado_em: number;
}

export interface BackupTXT {
  versao: number;
  exportado_em: string;
  professor: {
    nome: string;
    username: string;
    valor_hora: number;
  };
  aulas: Aula[];
  alunos: Aluno[];
  turmas: Turma[];
  fechamentos: Fechamento[];
  cronograma: CronogramaItem[];
}

export interface Sessao {
  professor_id: string;
  username: string;
  nome: string;
  login_em: number;
}
