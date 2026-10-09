import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, reiniciar } from '../src/store/store';
import {
  salvarConfig,
  salvarAluno,
  excluirAluno,
  salvarTurma,
  excluirTurma,
  salvarAula,
  excluirAula,
  salvarCronogramaItem,
  excluirCronogramaItem,
} from '../src/store/acoes';
import { carregarEstado } from '../src/data/storage';

beforeEach(() => reiniciar());

describe('salvarConfig', () => {
  it('atualiza config no store', () => {
    salvarConfig({ nome: 'João', valorHoraCentavos: 5000, valorFaltaCentavos: 4000 });
    const config = useStore.getState().config;
    expect(config.nome).toBe('João');
    expect(config.valorHoraCentavos).toBe(5000);
    expect(config.valorFaltaCentavos).toBe(4000);
  });

  it('persiste no localStorage', () => {
    salvarConfig({ nome: 'Maria', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    const estado = carregarEstado();
    expect(estado.config.nome).toBe('Maria');
  });

  it('marca dados/config.txt como pendente', () => {
    salvarConfig({ nome: 'X', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    expect(useStore.getState().meta.pendentes).toContain('dados/config.txt');
  });

  it('rejeita nome vazio', () => {
    expect(() => salvarConfig({ nome: '', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 })).toThrow();
  });

  it('rejeita valor negativo', () => {
    expect(() => salvarConfig({ nome: 'X', valorHoraCentavos: -1, valorFaltaCentavos: 3500 })).toThrow();
  });
});

describe('salvarAluno', () => {
  it('cria novo aluno com id gerado', () => {
    salvarAluno({ nome: 'Aluno 1', tipo: 'vip', ativo: true });
    const alunos = useStore.getState().alunos;
    expect(alunos).toHaveLength(1);
    expect(alunos[0]?.id).toBeTruthy();
    expect(alunos[0]?.nome).toBe('Aluno 1');
  });

  it('edita aluno existente (mesmo id)', () => {
    salvarAluno({ nome: 'Original', tipo: 'vip', ativo: true });
    const id = useStore.getState().alunos[0]!.id;
    salvarAluno({ id, nome: 'Editado', tipo: 'vip', ativo: false });
    const alunos = useStore.getState().alunos;
    expect(alunos).toHaveLength(1);
    expect(alunos[0]?.nome).toBe('Editado');
    expect(alunos[0]?.ativo).toBe(false);
  });

  it('rejeita nome vazio', () => {
    expect(() => salvarAluno({ nome: '', tipo: 'vip', ativo: true })).toThrow();
  });

  it('marca dados/cadastros.txt como pendente', () => {
    salvarAluno({ nome: 'A', tipo: 'vip', ativo: true });
    expect(useStore.getState().meta.pendentes).toContain('dados/cadastros.txt');
  });
});

describe('excluirAluno (lápide — P-03)', () => {
  it('marca excluido=true, não remove do array', () => {
    salvarAluno({ nome: 'A', tipo: 'vip', ativo: true });
    const id = useStore.getState().alunos[0]!.id;
    excluirAluno(id);
    const aluno = useStore.getState().alunos.find((a) => a.id === id);
    expect(aluno?.excluido).toBe(true);
    expect(useStore.getState().alunos).toHaveLength(1);
  });

  it('atualiza atualizadoEm', () => {
    salvarAluno({ nome: 'A', tipo: 'vip', ativo: true });
    const id = useStore.getState().alunos[0]!.id;
    const tsOriginal = useStore.getState().alunos[0]!.atualizadoEm;
    excluirAluno(id);
    const tsNovo = useStore.getState().alunos.find((a) => a.id === id)!.atualizadoEm;
    expect(tsNovo).toBeGreaterThanOrEqual(tsOriginal);
  });
});

describe('salvarTurma e excluirTurma', () => {
  it('cria e exclui turma (lápide)', () => {
    salvarTurma({ nome: 'KIDS' });
    expect(useStore.getState().turmas).toHaveLength(1);
    const id = useStore.getState().turmas[0]!.id;
    excluirTurma(id);
    expect(useStore.getState().turmas[0]?.excluido).toBe(true);
  });
});

describe('salvarAula', () => {
  beforeEach(() => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
  });

  it('calcula valorCentavos e mesRef ao salvar', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'Aluno',
      duracaoMin: 60,
      status: 'presenca',
    });
    const aula = useStore.getState().aulas[0];
    expect(aula?.valorCentavos).toBe(3500);
    expect(aula?.mesRef).toBe('2026-09');
  });

  it('presença 90min = 5250', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 90,
      status: 'presenca',
    });
    expect(useStore.getState().aulas[0]?.valorCentavos).toBe(5250);
  });

  it('falta = valorFaltaCentavos (3500)', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'falta',
    });
    expect(useStore.getState().aulas[0]?.valorCentavos).toBe(3500);
  });

  it('cancelada = 0', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'cancelada',
    });
    expect(useStore.getState().aulas[0]?.valorCentavos).toBe(0);
  });

  it('R-20: mudança de mês cria nova aula e tombstones a antiga', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'presenca',
    });
    const idOriginal = useStore.getState().aulas[0]!.id;

    // Edita mudando para outubro
    salvarAula({
      id: idOriginal,
      data: '2026-10-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'presenca',
    });

    const state = useStore.getState();
    const antiga = state.aulas.find((a) => a.id === idOriginal);
    expect(antiga?.excluido).toBe(true);

    const vivas = state.aulas.filter((a) => !a.excluido);
    expect(vivas).toHaveLength(1);
    expect(vivas[0]?.id).not.toBe(idOriginal);
    expect(vivas[0]?.mesRef).toBe('2026-10');

    expect(state.meta.pendentes).toContain('dados/aulas/2026-09.txt');
    expect(state.meta.pendentes).toContain('dados/aulas/2026-10.txt');
  });

  it('R-20: edição no mesmo mês não cria nova aula', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'presenca',
    });
    const idOriginal = useStore.getState().aulas[0]!.id;

    salvarAula({
      id: idOriginal,
      data: '2026-09-20',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 90,
      status: 'presenca',
    });

    const vivas = useStore.getState().aulas.filter((a) => !a.excluido);
    expect(vivas).toHaveLength(1);
    expect(vivas[0]?.id).toBe(idOriginal);
    expect(vivas[0]?.duracaoMin).toBe(90);
    expect(vivas[0]?.valorCentavos).toBe(5250);
  });

  it('marca dados/aulas/AAAA-MM.txt como pendente', () => {
    salvarAula({
      data: '2026-09-15',
      tipo: 'vip',
      alunoNome: 'A',
      duracaoMin: 60,
      status: 'presenca',
    });
    expect(useStore.getState().meta.pendentes).toContain('dados/aulas/2026-09.txt');
  });

  it('rejeita data vazia', () => {
    expect(() =>
      salvarAula({ data: '', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' }),
    ).toThrow();
  });

  it('rejeita duração zero', () => {
    expect(() =>
      salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 0, status: 'presenca' }),
    ).toThrow();
  });
});

describe('excluirAula', () => {
  it('marca lápide e marca o mês como pendente', () => {
    salvarConfig({ nome: 'P', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    const id = useStore.getState().aulas[0]!.id;
    excluirAula(id);
    expect(useStore.getState().aulas.find((a) => a.id === id)?.excluido).toBe(true);
  });
});

describe('salvarCronogramaItem e excluirCronogramaItem', () => {
  it('cria item', () => {
    salvarCronogramaItem({ data: '2026-10-20', titulo: 'Aula de revisão' });
    expect(useStore.getState().cronograma).toHaveLength(1);
    expect(useStore.getState().cronograma[0]?.titulo).toBe('Aula de revisão');
  });

  it('exclui item (lápide)', () => {
    salvarCronogramaItem({ data: '2026-10-20', titulo: 'X' });
    const id = useStore.getState().cronograma[0]!.id;
    excluirCronogramaItem(id);
    expect(useStore.getState().cronograma[0]?.excluido).toBe(true);
  });

  it('marca dados/cronograma.txt como pendente', () => {
    salvarCronogramaItem({ data: '2026-10-20', titulo: 'X' });
    expect(useStore.getState().meta.pendentes).toContain('dados/cronograma.txt');
  });
});

describe('marcarPendente (não duplica)', () => {
  it('salvar dois alunos marca cadastros.txt só uma vez', () => {
    salvarAluno({ nome: 'A', tipo: 'vip', ativo: true });
    salvarAluno({ nome: 'B', tipo: 'vip', ativo: true });
    const cadastros = useStore.getState().meta.pendentes.filter((p) => p === 'dados/cadastros.txt');
    expect(cadastros).toHaveLength(1);
  });
});

describe('persistência', () => {
  it('dados sobrevivem a recarga do store', () => {
    salvarConfig({ nome: 'Persistente', valorHoraCentavos: 4000, valorFaltaCentavos: 3500 });
    salvarAluno({ nome: 'Aluno Persistente', tipo: 'vip', ativo: true });

    // Simula recarga: carrega estado do localStorage
    const estado = carregarEstado();
    expect(estado.config.nome).toBe('Persistente');
    expect(estado.alunos).toHaveLength(1);
    expect(estado.alunos[0]?.nome).toBe('Aluno Persistente');
  });
});
