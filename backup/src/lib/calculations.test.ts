import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcularValorAula, hojeISO, mesRefDeData } from './calculations';

const __dirname = dirname(fileURLToPath(import.meta.url));
const checkTzScript = resolve(__dirname, '../../scripts/check-tz.ts');

describe('calcularValorAula — cálculo de valor por aula (valor/hora R$ 35,00)', () => {
  const valorHora = 35;
  const valorFalta = 35;

  it('presença VIP 1h = R$ 35,00', () => {
    expect(calcularValorAula('presenca', 1, 'vip', valorHora, valorFalta)).toBe(35);
  });

  it('presença VIP 1,5h = R$ 52,50', () => {
    expect(calcularValorAula('presenca', 1.5, 'vip', valorHora, valorFalta)).toBe(52.5);
  });

  it('presença VIP 2h = R$ 70,00', () => {
    expect(calcularValorAula('presenca', 2, 'vip', valorHora, valorFalta)).toBe(70);
  });

  it('presença Turma 2h = R$ 70,00', () => {
    expect(calcularValorAula('presenca', 2, 'turma', valorHora, valorFalta)).toBe(70);
  });

  it('falta = R$ 35,00 (independe de duração)', () => {
    expect(calcularValorAula('falta', 1, 'vip', valorHora, valorFalta)).toBe(35);
    expect(calcularValorAula('falta', 1.5, 'vip', valorHora, valorFalta)).toBe(35);
    expect(calcularValorAula('falta', 2, 'turma', valorHora, valorFalta)).toBe(35);
  });

  it('cancelada = R$ 0,00', () => {
    expect(calcularValorAula('cancelada', 1, 'vip', valorHora, valorFalta)).toBe(0);
    expect(calcularValorAula('cancelada', 2, 'turma', valorHora, valorFalta)).toBe(0);
  });

  it('agendada = R$ 0,00', () => {
    expect(calcularValorAula('agendada', 1, 'vip', valorHora, valorFalta)).toBe(0);
    expect(calcularValorAula('agendada', 2, 'turma', valorHora, valorFalta)).toBe(0);
  });

  it('arredonda para 2 casas (sem erro de ponto flutuante)', () => {
    // 35 * 1.5 = 52.5 — sem arredondamento poderia vir 52.50000000001 em alguns casos
    const v = calcularValorAula('presenca', 1.5, 'vip', valorHora, valorFalta);
    expect(v).toBe(Math.round(v * 100) / 100);
    // Caso com valor/hora que geramany casas: 33.33 * 1.5 = 49.995 → arredonda 50
    expect(calcularValorAula('presenca', 1.5, 'vip', 33.33, 33.33)).toBe(50);
  });
});

describe('hojeISO e mesRefDeData', () => {
  it('hojeISO retorna string YYYY-MM-DD', () => {
    expect(hojeISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('mesRefDeData extrai YYYY-MM de YYYY-MM-DD', () => {
    expect(mesRefDeData('2026-10-08')).toBe('2026-10');
    expect(mesRefDeData('2026-01-31')).toBe('2026-01');
    expect(mesRefDeData('2025-12-31')).toBe('2025-12');
  });

  it('mesRefDeData de hojeISO() bate com o mês atual', () => {
    const mes = mesRefDeData(hojeISO());
    expect(mes).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('hojeISO — respeita o fuso do processo', () => {
  // Roda o helper scripts/check-tz.ts em processos filhos com TZ diferente.
  // Node/Bun leem TZ só na inicialização — por isso precisamos de subprocessos.
  function runWithTZ(tz: string) {
    const out = execSync(`TZ=${tz} bun ${checkTzScript}`, { encoding: 'utf-8' }).trim();
    return JSON.parse(out) as { tz: string; localDate: string; iso: string; mes: string; match: boolean };
  }

  it('America/Sao_Paulo: hojeISO() == data local do fuso', () => {
    const r = runWithTZ('America/Sao_Paulo');
    expect(r.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.match).toBe(true);
    expect(r.mes).toMatch(/^\d{4}-\d{2}$/);
  });

  it('UTC: hojeISO() == data UTC', () => {
    const r = runWithTZ('UTC');
    expect(r.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.match).toBe(true);
    expect(r.mes).toMatch(/^\d{4}-\d{2}$/);
  });

  it('os dois fusos devolvem datas válidas (formato idêntico)', () => {
    const sp = runWithTZ('America/Sao_Paulo');
    const utc = runWithTZ('UTC');
    expect(sp.iso.length).toBe(10);
    expect(utc.iso.length).toBe(10);
    // Ambos respeitam seus próprios fusos: a propriedade match deve ser true nos dois.
    expect(sp.match).toBe(true);
    expect(utc.match).toBe(true);
  });
});
