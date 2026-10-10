import { describe, it, expect } from 'vitest';
import { decidirEstado, type EntradaDecidirEstado } from '../src/data/acesso';

describe('decidirEstado (tabela 24.2)', () => {
  it('desbloqueado: tem material local', () => {
    const r = decidirEstado({ temMaterialLocal: true, acessoExiste: null, erroRede: false });
    expect(r).toBe('desbloqueado');
  });

  it('pedeSenha: sem material local e acesso.txt existe', () => {
    const r = decidirEstado({ temMaterialLocal: false, acessoExiste: true, erroRede: false } as EntradaDecidirEstado);
    expect(r).toBe('pedeSenha');
  });

  it('primeiraConfiguracao: sem material local e acesso.txt não existe', () => {
    const r = decidirEstado({ temMaterialLocal: false, acessoExiste: false, erroRede: false } as EntradaDecidirEstado);
    expect(r).toBe('primeiraConfiguracao');
  });

  it('erroRede: erro de rede ao verificar', () => {
    const r = decidirEstado({ temMaterialLocal: false, acessoExiste: null, erroRede: true });
    expect(r).toBe('erroRede');
  });

  it('detectando: sem material local, sem erro, acessoExiste null', () => {
    const r = decidirEstado({ temMaterialLocal: false, acessoExiste: null, erroRede: false });
    expect(r).toBe('detectando');
  });

  it('desbloqueado prevalece sobre erroRede', () => {
    const r = decidirEstado({ temMaterialLocal: true, acessoExiste: null, erroRede: true });
    expect(r).toBe('desbloqueado');
  });
});

describe('validarForcaSenha', () => {
  it('rejeita senha curta', async () => {
    const { validarForcaSenha } = await import('../src/data/senhas-comuns');
    expect(validarForcaSenha('12345')).toBeTruthy();
  });

  it('rejeita senha comum', async () => {
    const { validarForcaSenha, SENHAS_COMUNS } = await import('../src/data/senhas-comuns');
    const umaComum = Array.from(SENHAS_COMUNS)[0]!;
    expect(validarForcaSenha(umaComum)).toBeTruthy();
  });

  it('aceita senha forte', async () => {
    const { validarForcaSenha } = await import('../src/data/senhas-comuns');
    expect(validarForcaSenha('Tr0co#de@aS3nhaForte')).toBeNull();
  });
});
