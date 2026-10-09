import { describe, it, expect } from 'vitest';
import {
  hojeLocal,
  mesRefDe,
  diaDaSemana,
  nomeMes,
  nomeMesCurto,
  somarMes,
  diasDoMes,
  todasDatasDoMes,
} from '../src/domain/datas';

describe('mesRefDe', () => {
  it('2026-10-31 → 2026-10', () => {
    expect(mesRefDe('2026-10-31')).toBe('2026-10');
  });
  it('2026-01-01 → 2026-01', () => {
    expect(mesRefDe('2026-01-01')).toBe('2026-01');
  });
});

describe('diaDaSemana', () => {
  it('2026-10-31 é sábado', () => {
    // 31 de outubro de 2026 = sábado
    expect(diaDaSemana('2026-10-31')).toBe('Sáb');
  });
  it('2026-10-08 é quinta', () => {
    expect(diaDaSemana('2026-10-08')).toBe('Qui');
  });
});

describe('nomeMes', () => {
  it('2026-09 = setembro 2026', () => {
    expect(nomeMes('2026-09')).toBe('setembro 2026');
  });
  it('2026-01 = janeiro 2026', () => {
    expect(nomeMes('2026-01')).toBe('janeiro 2026');
  });
});

describe('nomeMesCurto', () => {
  it('2026-09 = set/2026', () => {
    expect(nomeMesCurto('2026-09')).toBe('set/2026');
  });
});

describe('somarMes', () => {
  it('2026-12 + 1 = 2027-01 (virada de ano)', () => {
    expect(somarMes('2026-12', 1)).toBe('2027-01');
  });
  it('2026-09 + 3 = 2026-12', () => {
    expect(somarMes('2026-09', 3)).toBe('2026-12');
  });
  it('2027-01 - 1 = 2026-12', () => {
    expect(somarMes('2027-01', -1)).toBe('2026-12');
  });
});

describe('diasDoMes', () => {
  it('setembro tem 30 dias', () => {
    expect(diasDoMes('2026-09')).toBe(30);
  });
  it('fevereiro 2026 (não bissexto) tem 28', () => {
    expect(diasDoMes('2026-02')).toBe(28);
  });
  it('fevereiro 2024 (bissexto) tem 29', () => {
    expect(diasDoMes('2024-02')).toBe(29);
  });
});

describe('todasDatasDoMes', () => {
  it('gera 30 datas para setembro', () => {
    const datas = todasDatasDoMes('2026-09');
    expect(datas).toHaveLength(30);
    expect(datas[0]).toBe('2026-09-01');
    expect(datas[29]).toBe('2026-09-30');
  });
});

describe('hojeLocal (depende do TZ do processo)', () => {
  it('retorna string AAAA-MM-DD', () => {
    expect(hojeLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('mesRefDe com data de dia 31 às 23h30 (R-90 teste E2E E-05)', () => {
  // R-27: proibido new Date('AAAA-MM-DD'). A regra garante que o dia 31
  // não vira 1 do mês seguinte por interpretação UTC.
  it('aula em 2026-10-31 pertence a 2026-10', () => {
    expect(mesRefDe('2026-10-31')).toBe('2026-10');
  });
});
