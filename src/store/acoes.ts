// Ações do store. Única forma de mutar o estado. (R-29)
//
// Toda ação: valida, atualiza o store, grava no armazenamento local,
// marca o arquivo afetado como pendente.
// (Agendar sync é M4 — as ações já preparam os pendentes.)

import { useStore } from './store';
import { salvarEstado, salvarMeta } from '../data/storage';
import { CAMINHO_CADASTROS, CAMINHO_CONFIG, CAMINHO_CRONOGRAMA, CAMINHO_FECHAMENTOS, caminhoAulaMes, agendarSync } from '../data/sync';
import { calcularValorAulaCentavos } from '../domain/calculos';
import { mesRefDe } from '../domain/datas';
import { criarFechamento, mesFechado } from '../domain/fechamentos';
import type { TipoAula, StatusAula, Aluno, Turma, Aula, CronogramaItem, Config, Fechamento } from '../domain/tipos';

// ===== Helpers internos =====

function persistir(): void {
  const { meta: _meta, erroCorrupcao: _erro, ...estado } = useStore.getState();
  void _meta;
  void _erro;
  salvarEstado(estado);
}

function marcarPendente(caminho: string): void {
  const { meta } = useStore.getState();
  if (meta.pendentes.includes(caminho)) return;
  const novaMeta = { ...meta, pendentes: [...meta.pendentes, caminho] };
  salvarMeta(novaMeta);
  useStore.setState({ meta: novaMeta });
  // R-41: debounce 2s → ciclo de sync
  agendarSync();
}

function gerarId(): string {
  return crypto.randomUUID();
}

function agora(): number {
  return Date.now();
}

// ===== Config =====

export function salvarConfig(dados: { nome: string; valorHoraCentavos: number; valorFaltaCentavos: number }): void {
  if (!dados.nome.trim()) throw new Error('Nome é obrigatório');
  if (dados.valorHoraCentavos < 0) throw new Error('Valor da hora não pode ser negativo');
  if (dados.valorFaltaCentavos < 0) throw new Error('Valor da falta não pode ser negativo');

  const config: Config = {
    nome: dados.nome.trim(),
    valorHoraCentavos: dados.valorHoraCentavos,
    valorFaltaCentavos: dados.valorFaltaCentavos,
    atualizadoEm: agora(),
  };
  useStore.setState({ config });
  persistir();
  marcarPendente(CAMINHO_CONFIG);
}

// ===== Alunos =====

export function salvarAluno(dados: {
  id?: string;
  nome: string;
  tipo: TipoAula;
  turmaId?: string;
  ativo: boolean;
}): void {
  if (!dados.nome.trim()) throw new Error('Nome do aluno é obrigatório');

  const id = dados.id ?? gerarId();
  const atualizadoEm = agora();
  const aluno: Aluno = {
    id,
    atualizadoEm,
    nome: dados.nome.trim(),
    tipo: dados.tipo,
    turmaId: dados.turmaId || undefined,
    ativo: dados.ativo,
  };

  const state = useStore.getState();
  const existe = state.alunos.some((a) => a.id === id);
  const alunos = existe
    ? state.alunos.map((a) => (a.id === id ? aluno : a))
    : [...state.alunos, aluno];

  useStore.setState({ alunos });
  persistir();
  marcarPendente(CAMINHO_CADASTROS);
}

export function excluirAluno(id: string): void {
  const state = useStore.getState();
  const alunos = state.alunos.map((a) =>
    a.id === id ? { ...a, excluido: true as const, atualizadoEm: agora() } : a,
  );
  useStore.setState({ alunos });
  persistir();
  marcarPendente(CAMINHO_CADASTROS);
}

// ===== Turmas =====

export function salvarTurma(dados: { id?: string; nome: string }): void {
  if (!dados.nome.trim()) throw new Error('Nome da turma é obrigatório');

  const id = dados.id ?? gerarId();
  const atualizadoEm = agora();
  const turma: Turma = { id, atualizadoEm, nome: dados.nome.trim() };

  const state = useStore.getState();
  const existe = state.turmas.some((t) => t.id === id);
  const turmas = existe
    ? state.turmas.map((t) => (t.id === id ? turma : t))
    : [...state.turmas, turma];

  useStore.setState({ turmas });
  persistir();
  marcarPendente(CAMINHO_CADASTROS);
}

export function excluirTurma(id: string): void {
  const state = useStore.getState();
  const turmas = state.turmas.map((t) =>
    t.id === id ? { ...t, excluido: true as const, atualizadoEm: agora() } : t,
  );
  useStore.setState({ turmas });
  persistir();
  marcarPendente(CAMINHO_CADASTROS);
}

// ===== Aulas =====

export function salvarAula(dados: {
  id?: string;
  data: string;
  horario?: string;
  tipo: TipoAula;
  alunoId?: string;
  turmaId?: string;
  alunoNome: string;
  duracaoMin: number;
  status: StatusAula;
  conteudo?: string;
}): void {
  if (!dados.data) throw new Error('Data é obrigatória');
  if (!dados.alunoNome.trim()) throw new Error('Aluno é obrigatório');
  if (dados.duracaoMin <= 0) throw new Error('Duração deve ser maior que zero');

  const config = useStore.getState().config;
  const valorCentavos = calcularValorAulaCentavos(
    dados.status,
    dados.duracaoMin,
    config.valorHoraCentavos,
    config.valorFaltaCentavos,
  );
  const mesRef = mesRefDe(dados.data);
  const id = dados.id ?? gerarId();
  const atualizadoEm = agora();

  // R-25: edição de aula de mês fechado exige confirmação.
  const state = useStore.getState();
  if (dados.id && mesFechado(state.fechamentos, mesRef)) {
    throw new Error(
      `O mês ${mesRef} já foi fechado. Use a tela de Fechamentos para reabrir antes de editar.`,
    );
  }

  const aula: Aula = {
    id,
    atualizadoEm,
    data: dados.data,
    horario: dados.horario || undefined,
    tipo: dados.tipo,
    alunoId: dados.alunoId || undefined,
    turmaId: dados.turmaId || undefined,
    alunoNome: dados.alunoNome.trim(),
    duracaoMin: dados.duracaoMin,
    status: dados.status,
    conteudo: dados.conteudo || undefined,
    valorCentavos,
    mesRef,
  };

  const original = state.aulas.find((a) => a.id === id);

  // R-20: mudança de mês → nova aula (novo id) + antiga como excluída
  if (original && mesRefDe(original.data) !== mesRef) {
    const novaAula: Aula = { ...aula, id: gerarId(), atualizadoEm: agora() };
    const antiga: Aula = { ...original, excluido: true as const, atualizadoEm: agora() };
    const aulas = state.aulas.map((a) => (a.id === original.id ? antiga : a)).concat([novaAula]);
    useStore.setState({ aulas });
    persistir();
    marcarPendente(caminhoAulaMes(mesRefDe(original.data)));
    marcarPendente(caminhoAulaMes(mesRef));
    return;
  }

  // Save normal (criação ou edição no mesmo mês)
  const existe = state.aulas.some((a) => a.id === id);
  const aulas = existe
    ? state.aulas.map((a) => (a.id === id ? aula : a))
    : [...state.aulas, aula];

  useStore.setState({ aulas });
  persistir();
  marcarPendente(caminhoAulaMes(mesRef));
}

export function excluirAula(id: string): void {
  const state = useStore.getState();
  const aula = state.aulas.find((a) => a.id === id);
  if (!aula) return;
  const aulas = state.aulas.map((a) =>
    a.id === id ? { ...a, excluido: true as const, atualizadoEm: agora() } : a,
  );
  useStore.setState({ aulas });
  persistir();
  marcarPendente(caminhoAulaMes(aula.mesRef));
}

// ===== Cronograma =====

export function salvarCronogramaItem(dados: {
  id?: string;
  data: string;
  horario?: string;
  titulo: string;
  alunoNome?: string;
  duracaoMin?: number;
  observacao?: string;
}): void {
  if (!dados.data) throw new Error('Data é obrigatória');
  if (!dados.titulo.trim()) throw new Error('Título é obrigatório');

  const id = dados.id ?? gerarId();
  const atualizadoEm = agora();
  const item: CronogramaItem = {
    id,
    atualizadoEm,
    data: dados.data,
    horario: dados.horario || undefined,
    titulo: dados.titulo.trim(),
    alunoNome: dados.alunoNome || undefined,
    duracaoMin: dados.duracaoMin,
    observacao: dados.observacao || undefined,
  };

  const state = useStore.getState();
  const existe = state.cronograma.some((c) => c.id === id);
  const cronograma = existe
    ? state.cronograma.map((c) => (c.id === id ? item : c))
    : [...state.cronograma, item];

  useStore.setState({ cronograma });
  persistir();
  marcarPendente(CAMINHO_CRONOGRAMA);
}

export function excluirCronogramaItem(id: string): void {
  const state = useStore.getState();
  const cronograma = state.cronograma.map((c) =>
    c.id === id ? { ...c, excluido: true as const, atualizadoEm: agora() } : c,
  );
  useStore.setState({ cronograma });
  persistir();
  marcarPendente(CAMINHO_CRONOGRAMA);
}

// ===== Fechamentos =====

/** R-25: fecha o mês criando snapshot imutável. Recusa se já está fechado. */
export function fecharMes(mesRef: string): void {
  const state = useStore.getState();
  if (mesFechado(state.fechamentos, mesRef)) {
    throw new Error(`Mês ${mesRef} já está fechado`);
  }
  const aulasDoMes = state.aulas.filter((a) => !a.excluido && a.mesRef === mesRef);
  const fechamento: Fechamento = criarFechamento(mesRef, aulasDoMes);
  const fechamentos = [...state.fechamentos, fechamento];
  useStore.setState({ fechamentos });
  persistir();
  marcarPendente(CAMINHO_FECHAMENTOS);
}

/** Reabre um mês (marca o Fechamento como excluído — lápide). */
export function reabrirMes(mesRef: string): void {
  const state = useStore.getState();
  const fechamentos = state.fechamentos.map((f) =>
    f.mesRef === mesRef && !f.excluido ? { ...f, excluido: true as const, atualizadoEm: agora() } : f,
  );
  useStore.setState({ fechamentos });
  persistir();
  marcarPendente(CAMINHO_FECHAMENTOS);
}

/** R-25: editar aula de mês fechado exige confirmação (a UI chama). */
export function editarAulaMesFechado(id: string, dados: Parameters<typeof salvarAula>[0]): void {
  const state = useStore.getState();
  const aula = state.aulas.find((a) => a.id === id);
  if (!aula) throw new Error('Aula não encontrada');
  const fechamento = mesFechado(state.fechamentos, aula.mesRef);
  if (fechamento) {
    // A UI já pediu confirmação. Prossegue.
  }
  salvarAula(dados);
}
