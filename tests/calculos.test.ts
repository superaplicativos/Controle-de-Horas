import { describe, it, expect } from 'vitest';
import {
  calcularValorAulaCentavos,
  minutosContaveis,
  calcularResumoMes,
  variacaoPercentual,
  formatarCentavos,
  formatarMinutos,
} from '../src/domain/calculos';
import type { Aula } from '../src/domain/tipos';

describe('calcularValorAulaCentavos', () => {
  // R-21, R-90 (testes obrigatórios da seção 16)
  it('presença 60 min = 3500', () => {
    expect(calcularValorAulaCentavos('presenca', 60, 3500, 3500)).toBe(3500);
  });
  it('presença 90 min = 5250', () => {
    expect(calcularValorAulaCentavos('presenca', 90, 3500, 3500)).toBe(5250);
  });
  it('presença 120 min = 7000', () => {
    expect(calcularValorAulaCentavos('presenca', 120, 3500, 3500)).toBe(7000);
  });
  it('presença turma 120 min = 7000', () => {
    expect(calcularValorAulaCentavos('presenca', 120, 3500, 3500)).toBe(7000);
  });
  it('falta = 3500 (conta como 60 min)', () => {
    expect(calcularValorAulaCentavos('falta', 60, 3500, 3500)).toBe(3500);
  });
  it('falta com duração diferente ainda = valorFalta', () => {
    expect(calcularValorAulaCentavos('falta', 120, 3500, 3500)).toBe(3500);
  });
  it('cancelada = 0', () => {
    expect(calcularValorAulaCentavos('cancelada', 60, 3500, 3500)).toBe(0);
  });
  it('agendada = 0', () => {
    expect(calcularValorAulaCentavos('agendada', 60, 3500, 3500)).toBe(0);
  });
  it('valor da hora 3333 com 90 min = 5000 (arredondamento)', () => {
    // 3333 * 90 / 60 = 4999.5 → Math.round = 5000
    expect(calcularValorAulaCentavos('presenca', 90, 3333, 3500)).toBe(5000);
  });
});

describe('minutosContaveis', () => {
  it('presença 90 min = 90', () => {
    expect(minutosContaveis('presenca', 90)).toBe(90);
  });
  it('falta 90 min = 60 (sempre 60)', () => {
    expect(minutosContaveis('falta', 90)).toBe(60);
  });
  it('cancelada = 0', () => {
    expect(minutosContaveis('cancelada', 60)).toBe(0);
  });
  it('agendada = 0', () => {
    expect(minutosContaveis('agendada', 60)).toBe(0);
  });
});

function aula(overrides: Partial<Aula> = {}): Aula {
  return {
    id: 'a1',
    atualizadoEm: 1000,
    data: '2026-09-15',
    tipo: 'vip',
    alunoNome: 'Aluno',
    duracaoMin: 60,
    status: 'presenca',
    valorCentavos: 3500,
    mesRef: '2026-09',
    ...overrides,
  };
}

describe('calcularResumoMes', () => {
  it('lista vazia = tudo zero', () => {
    const r = calcularResumoMes([]);
    expect(r.totalAulas).toBe(0);
    expect(r.totalMinutos).toBe(0);
    expect(r.totalCentavos).toBe(0);
  });
  it('soma presenças e faltas', () => {
    const r = calcularResumoMes([
      aula({ id: '1', duracaoMin: 60, status: 'presenca', valorCentavos: 3500 }),
      aula({ id: '2', duracaoMin: 90, status: 'presenca', valorCentavos: 5250 }),
      aula({ id: '3', status: 'falta', valorCentavos: 3500 }),
    ]);
    expect(r.totalAulas).toBe(3);
    expect(r.totalMinutos).toBe(60 + 90 + 60);
    expect(r.totalCentavos).toBe(3500 + 5250 + 3500);
    expect(r.totalPresencas).toBe(2);
    expect(r.totalFaltas).toBe(1);
  });
  it('ignora excluídos (lápides)', () => {
    const r = calcularResumoMes([
      aula({ id: '1', duracaoMin: 60, status: 'presenca', valorCentavos: 3500 }),
      aula({ id: '2', excluido: true, duracaoMin: 90, status: 'presenca', valorCentavos: 5250 }),
    ]);
    expect(r.totalAulas).toBe(1);
    expect(r.totalCentavos).toBe(3500);
  });
  it('valorPorDia agrupa por dia', () => {
    const r = calcularResumoMes([
      aula({ id: '1', data: '2026-09-01', valorCentavos: 3500 }),
      aula({ id: '2', data: '2026-09-01', valorCentavos: 7000 }),
      aula({ id: '3', data: '2026-09-15', valorCentavos: 5250 }),
    ]);
    expect(r.valorPorDia).toEqual([
      { dia: 1, centavos: 10500 },
      { dia: 15, centavos: 5250 },
    ]);
  });
});

describe('variacaoPercentual', () => {
  it('100 contra 50 = +100', () => {
    expect(variacaoPercentual(100, 50)).toBe(100);
  });
  it('50 contra 100 = -50', () => {
    expect(variacaoPercentual(50, 100)).toBe(-50);
  });
  it('anterior 0 = null (mostra "novo")', () => {
    expect(variacaoPercentual(100, 0)).toBeNull();
  });
});

describe('formatadores', () => {
  it('formatarCentavos 3500 = R$ 35,00', () => {
    expect(formatarCentavos(3500)).toMatch(/R\$\s*35,00/);
  });
  it('formatarCentavos 5250 = R$ 52,50', () => {
    expect(formatarCentavos(5250)).toMatch(/R\$\s*52,50/);
  });
  it('formatarMinutos 60 = 1h', () => {
    expect(formatarMinutos(60)).toBe('1h');
  });
  it('formatarMinutos 90 = 1h30', () => {
    expect(formatarMinutos(90)).toBe('1h30');
  });
  it('formatarMinutos 120 = 2h', () => {
    expect(formatarMinutos(120)).toBe('2h');
  });
});
