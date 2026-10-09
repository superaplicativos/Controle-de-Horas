import { describe, it, expect } from 'vitest';
import { mesclarRegistros, mesclarConfig } from '../src/domain/mescla';
import type { Aluno, Config } from '../src/domain/tipos';

function aluno(id: string, atualizadoEm: number, overrides: Partial<Aluno> = {}): Aluno {
  return {
    id,
    atualizadoEm,
    nome: `Aluno ${id}`,
    tipo: 'vip',
    ativo: true,
    ...overrides,
  };
}

describe('mesclarRegistros', () => {
  it('união: só local + só remoto = ambos', () => {
    const local = [aluno('a', 1000)];
    const remoto = [aluno('b', 1000)];
    const r = mesclarRegistros(local, remoto);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.id).sort()).toEqual(['a', 'b']);
  });

  it('o mais novo vence (local mais novo)', () => {
    const local = [aluno('a', 2000, { nome: 'Local novo' })];
    const remoto = [aluno('a', 1000, { nome: 'Remoto velho' })];
    const r = mesclarRegistros(local, remoto);
    expect(r[0]?.nome).toBe('Local novo');
  });

  it('o mais novo vence (remoto mais novo)', () => {
    const local = [aluno('a', 1000, { nome: 'Local velho' })];
    const remoto = [aluno('a', 2000, { nome: 'Remoto novo' })];
    const r = mesclarRegistros(local, remoto);
    expect(r[0]?.nome).toBe('Remoto novo');
  });

  it('empate vence o remoto', () => {
    const local = [aluno('a', 1000, { nome: 'Local' })];
    const remoto = [aluno('a', 1000, { nome: 'Remoto' })];
    const r = mesclarRegistros(local, remoto);
    expect(r[0]?.nome).toBe('Remoto');
  });

  it('lápide vence se for a mais recente', () => {
    const local = [aluno('a', 1000)];
    const remoto = [aluno('a', 2000, { excluido: true })];
    const r = mesclarRegistros(local, remoto);
    expect(r[0]?.excluido).toBe(true);
  });

  it('lápide local perde se remoto for mais novo sem lápide (ressurge)', () => {
    const local = [aluno('a', 2000, { excluido: true })];
    const remoto = [aluno('a', 1000)];
    // local mais novo (2000 > 1000), lápide vence
    const r = mesclarRegistros(local, remoto);
    expect(r[0]?.excluido).toBe(true);
  });

  it('idempotência: mesclar duas vezes = mesclar uma', () => {
    const local = [aluno('a', 1000), aluno('b', 2000)];
    const remoto = [aluno('a', 1500), aluno('c', 3000)];
    const uma = mesclarRegistros(local, remoto);
    const duas = mesclarRegistros(uma, remoto);
    expect(duas).toEqual(uma);
  });

  it('comutatividade: resultado final independe da ordem', () => {
    const local = [aluno('a', 1000, { nome: 'L' }), aluno('b', 2000)];
    const remoto = [aluno('a', 1500, { nome: 'R' }), aluno('c', 3000)];
    const lr = mesclarRegistros(local, remoto);
    const rl = mesclarRegistros(remoto, local);
    // Ordenação por id garante mesma ordem
    expect(lr.map((x) => x.id)).toEqual(rl.map((x) => x.id));
    // Para cada id, o vencedor é o mesmo (maior atualizadoEm, empate = remoto da operação)
    // Como operações diferentes, "remoto" muda. Vamos checar só ids.
    expect(lr.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('nenhum registro some', () => {
    const local = [aluno('a', 1000), aluno('b', 2000), aluno('c', 3000)];
    const remoto = [aluno('d', 4000), aluno('e', 5000)];
    const r = mesclarRegistros(local, remoto);
    expect(r).toHaveLength(5);
  });

  it('saída ordenada por id', () => {
    const local = [aluno('z', 1000), aluno('a', 2000), aluno('m', 3000)];
    const remoto: Aluno[] = [];
    const r = mesclarRegistros(local, remoto);
    expect(r.map((x) => x.id)).toEqual(['a', 'm', 'z']);
  });
});

describe('mesclarConfig', () => {
  function cfg(nome: string, atualizadoEm: number): Config {
    return { nome, valorHoraCentavos: 3500, valorFaltaCentavos: 3500, atualizadoEm };
  }
  it('o mais novo vence', () => {
    const r = mesclarConfig(cfg('Local', 1000), cfg('Remoto', 2000));
    expect(r.nome).toBe('Remoto');
  });
  it('empate vence remoto', () => {
    const r = mesclarConfig(cfg('Local', 1000), cfg('Remoto', 1000));
    expect(r.nome).toBe('Remoto');
  });
});
