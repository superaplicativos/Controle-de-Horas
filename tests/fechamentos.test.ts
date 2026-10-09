import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, reiniciar } from '../src/store/store';
import { salvarConfig, salvarAula, fecharMes, reabrirMes } from '../src/store/acoes';
import { mesFechado, divergeDoSnapshot, criarFechamento } from '../src/domain/fechamentos';
import type { Aula } from '../src/domain/tipos';

beforeEach(() => reiniciar());

describe('criarFechamento', () => {
  it('cria snapshot com totais corretos', () => {
    const aulas: Aula[] = [
      { id: '1', atualizadoEm: 1000, data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
      { id: '2', atualizadoEm: 1000, data: '2026-09-16', tipo: 'vip', alunoNome: 'A', duracaoMin: 90, status: 'presenca', valorCentavos: 5250, mesRef: '2026-09' },
      { id: '3', atualizadoEm: 1000, data: '2026-09-17', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'falta', valorCentavos: 3500, mesRef: '2026-09' },
    ];
    const f = criarFechamento('2026-09', aulas);
    expect(f.mesRef).toBe('2026-09');
    expect(f.totalAulas).toBe(3);
    expect(f.totalCentavos).toBe(12250);
    expect(f.totalMinutos).toBe(60 + 90 + 60);
    expect(f.totalFaltas).toBe(1);
    expect(f.totalPresencas).toBe(2);
    expect(f.fechadoEm).toBeGreaterThan(0);
  });

  it('ignora aulas excluídas (lápides)', () => {
    const aulas: Aula[] = [
      { id: '1', atualizadoEm: 1000, data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
      { id: '2', atualizadoEm: 1000, data: '2026-09-16', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09', excluido: true },
    ];
    const f = criarFechamento('2026-09', aulas);
    expect(f.totalAulas).toBe(1);
    expect(f.totalCentavos).toBe(3500);
  });
});

describe('mesFechado', () => {
  it('retorna undefined se não há fechamento', () => {
    expect(mesFechado([], '2026-09')).toBeUndefined();
  });

  it('retorna o fechamento se existe', () => {
    const f = criarFechamento('2026-09', []);
    expect(mesFechado([f], '2026-09')).toBe(f);
  });

  it('ignora fechamentos excluídos (lápides)', () => {
    const f = { ...criarFechamento('2026-09', []), excluido: true as const };
    expect(mesFechado([f], '2026-09')).toBeUndefined();
  });
});

describe('divergeDoSnapshot', () => {
  it('retorna false se nada mudou', () => {
    const aulas: Aula[] = [
      { id: '1', atualizadoEm: 1000, data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
    ];
    const f = criarFechamento('2026-09', aulas);
    expect(divergeDoSnapshot(f, aulas)).toBe(false);
  });

  it('retorna true se aula foi adicionada depois', () => {
    const aulasOriginais: Aula[] = [
      { id: '1', atualizadoEm: 1000, data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
    ];
    const f = criarFechamento('2026-09', aulasOriginais);
    const aulasDepois: Aula[] = [
      ...aulasOriginais,
      { id: '2', atualizadoEm: 2000, data: '2026-09-20', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
    ];
    expect(divergeDoSnapshot(f, aulasDepois)).toBe(true);
  });

  it('retorna true se valor mudou', () => {
    const aulas: Aula[] = [
      { id: '1', atualizadoEm: 1000, data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca', valorCentavos: 3500, mesRef: '2026-09' },
    ];
    const f = criarFechamento('2026-09', aulas);
    const aulasModificadas: Aula[] = [{ ...aulas[0]!, valorCentavos: 5000 }];
    expect(divergeDoSnapshot(f, aulasModificadas)).toBe(true);
  });
});

describe('fecharMes (ação do store)', () => {
  beforeEach(() => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
  });

  it('cria Fechamento no store', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    fecharMes('2026-09');
    const f = useStore.getState().fechamentos.find((x) => x.mesRef === '2026-09');
    expect(f).toBeDefined();
    expect(f?.totalAulas).toBe(1);
    expect(f?.totalCentavos).toBe(3500);
  });

  it('marca dados/fechamentos.txt como pendente', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    fecharMes('2026-09');
    expect(useStore.getState().meta.pendentes).toContain('dados/fechamentos.txt');
  });

  it('recusa fechar mês já fechado', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    fecharMes('2026-09');
    expect(() => fecharMes('2026-09')).toThrow(/já está fechado/);
  });

  it('salvarAula recusa edição de mês fechado (R-25)', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    const id = useStore.getState().aulas[0]!.id;
    fecharMes('2026-09');

    expect(() =>
      salvarAula({ id, data: '2026-09-20', tipo: 'vip', alunoNome: 'A', duracaoMin: 90, status: 'presenca' }),
    ).toThrow(/já foi fechado/);
  });

  it('salvarAula permite criar nova aula em mês fechado', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    fecharMes('2026-09');

    // Criar nova (sem id) em mês fechado — deve permitir
    salvarAula({ data: '2026-09-20', tipo: 'vip', alunoNome: 'B', duracaoMin: 60, status: 'presenca' });
    const vivas = useStore.getState().aulas.filter((a) => !a.excluido);
    expect(vivas).toHaveLength(2);
  });
});

describe('reabrirMes (ação do store)', () => {
  beforeEach(() => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
  });

  it('marca Fechamento como excluído (lápide)', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    fecharMes('2026-09');
    reabrirMes('2026-09');
    const f = useStore.getState().fechamentos.find((x) => x.mesRef === '2026-09');
    expect(f?.excluido).toBe(true);
    expect(mesFechado(useStore.getState().fechamentos, '2026-09')).toBeUndefined();
  });

  it('reabrir permite editar aulas novamente', () => {
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    const id = useStore.getState().aulas[0]!.id;
    fecharMes('2026-09');
    reabrirMes('2026-09');

    // Agora deve permitir editar
    salvarAula({ id, data: '2026-09-20', tipo: 'vip', alunoNome: 'A', duracaoMin: 90, status: 'presenca' });
    const aula = useStore.getState().aulas.find((a) => a.id === id);
    expect(aula?.duracaoMin).toBe(90);
  });
});
