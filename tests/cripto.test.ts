import { describe, it, expect } from 'vitest';
import {
  cifrarArquivo,
  decifrarArquivo,
  importarChaveDados,
  chaveDadosAleatoria,
  bytesParaBase64,
  base64ParaBytes,
  bytesParaBase32,
  base32ParaBytes,
  cifrarAcesso,
  decifrarAcesso,
  salAleatorio,
  derivarChaveDeSenha,
} from '../src/data/cripto';

describe('base64 round-trip', () => {
  it('João Açaí ñ 🙂', () => {
    const original = 'João Açaí ñ 🙂';
    const bytes = new TextEncoder().encode(original);
    const b64 = bytesParaBase64(bytes);
    const decodificado = base64ParaBytes(b64);
    expect(new TextDecoder().decode(decodificado)).toBe(original);
  });
});

describe('base32 round-trip', () => {
  it('chave de 32 bytes', () => {
    const chave = new Uint8Array(32);
    for (let i = 0; i < 32; i++) chave[i] = i;
    const b32 = bytesParaBase32(chave);
    const decodificado = base32ParaBytes(b32);
    expect(Array.from(decodificado)).toEqual(Array.from(chave));
  });
});

describe('cifrarArquivo / decifrarArquivo (AES-256-GCM)', () => {
  it('round-trip: cifra e decifra com a mesma chave e AAD', async () => {
    const chaveBytes = chaveDadosAleatoria();
    const chave = await importarChaveDados(chaveBytes);
    const texto = JSON.stringify({ versaoFormato: 1, aulas: [{ id: 'a1', nome: 'João' }] });
    const cifrado = await cifrarArquivo(chave, texto, 'dados/aulas/2026-09.txt');
    const decifrado = await decifrarArquivo(chave, cifrado, 'dados/aulas/2026-09.txt');
    expect(decifrado).toBe(texto);
  });

  it('R-74: IV diferente a cada cifra do mesmo texto', async () => {
    const chave = await importarChaveDados(chaveDadosAleatoria());
    const texto = 'mesmo texto';
    const c1 = await cifrarArquivo(chave, texto, 'a.txt');
    const c2 = await cifrarArquivo(chave, texto, 'a.txt');
    expect(c1.iv).not.toBe(c2.iv);
    expect(c1.ct).not.toBe(c2.ct);
  });

  it('R-75: senha errada (chave errada) falha', async () => {
    const chave1 = await importarChaveDados(chaveDadosAleatoria());
    const chave2 = await importarChaveDados(chaveDadosAleatoria());
    const cifrado = await cifrarArquivo(chave1, 'secreto', 'a.txt');
    await expect(decifrarArquivo(chave2, cifrado, 'a.txt')).rejects.toThrow('DECRYPT_FAILED');
  });

  it('R-75: arquivo adulterado em 1 byte falha', async () => {
    const chave = await importarChaveDados(chaveDadosAleatoria());
    const cifrado = await cifrarArquivo(chave, 'secreto', 'a.txt');
    // Adultera 1 byte do ct
    const ctBytes = base64ParaBytes(cifrado.ct);
    ctBytes[0] = ctBytes[0]! ^ 0xff;
    cifrado.ct = bytesParaBase64(ctBytes);
    await expect(decifrarArquivo(chave, cifrado, 'a.txt')).rejects.toThrow('DECRYPT_FAILED');
  });

  it('R-75: AAD errado (arquivo trocado de lugar) falha', async () => {
    const chave = await importarChaveDados(chaveDadosAleatoria());
    const cifrado = await cifrarArquivo(chave, 'secreto', 'dados/config.txt');
    await expect(decifrarArquivo(chave, cifrado, 'dados/aulas/2026-09.txt')).rejects.toThrow('DECRYPT_FAILED');
  });
});

describe('cifrarAcesso / decifrarAcesso (PBKDF2 + AES-256-GCM)', () => {
  it('round-trip: senha certa decifra', async () => {
    const conteudo = { chaveDados: 'ABC123', token: 'github_pat_xxx' };
    const cifrado = await cifrarAcesso('minhaSenhaForte123', conteudo);
    const decifrado = await decifrarAcesso('minhaSenhaForte123', cifrado);
    expect(decifrado).toEqual(conteudo);
  });

  it('R-75: senha errada falha', async () => {
    const cifrado = await cifrarAcesso('senhaCorreta123', { chaveDados: 'X', token: 'Y' });
    await expect(decifrarAcesso('senhaErrada123', cifrado)).rejects.toThrow('DECRYPT_FAILED');
  });

  it('derivação determinística com o mesmo sal', async () => {
    const sal = salAleatorio();
    const k1 = await derivarChaveDeSenha('minhaSenha', sal);
    const k2 = await derivarChaveDeSenha('minhaSenha', sal);
    // Ambas derivam da mesma senha+sal, mas CryptoKey não é comparável diretamente.
    // Verificamos que cifrar com uma e decifrar com a outra funciona.
    const cifrado = await cifrarArquivo(k1, 'teste', 'a.txt');
    const decifrado = await decifrarArquivo(k2, cifrado, 'a.txt');
    expect(decifrado).toBe('teste');
  });
});
