import { describe, it, expect } from 'vitest';
import { migrarEstado } from '../src/domain/migracoes';
import { VERSAO_FORMATO_ATUAL, estadoVazio } from '../src/domain/tipos';

describe('migrarEstado', () => {
  it('versão atual passa direto', () => {
    const estado = estadoVazio();
    const r = migrarEstado(estado);
    expect(r.versaoFormato).toBe(VERSAO_FORMATO_ATUAL);
  });

  it('versão maior que a atual é recusada com erro explicativo', () => {
    const futuro = { ...estadoVazio(), versaoFormato: 999 };
    expect(() => migrarEstado(futuro)).toThrow(/maior que a suportada/);
  });

  it('versão ausente é recusada', () => {
    expect(() => migrarEstado({})).toThrow(/versaoFormato ausente/);
  });

  it('não é objeto é recusado', () => {
    expect(() => migrarEstado(null)).toThrow();
    expect(() => migrarEstado('string')).toThrow();
    expect(() => migrarEstado(42)).toThrow();
  });
});
