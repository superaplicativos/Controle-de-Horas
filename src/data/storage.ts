// ÚNICO arquivo que toca localStorage. (R-33, P-09, R-12)
//
// Três chaves, e só elas:
//   ch:estado:v1  — estado completo de dados (Estado do domain)
//   ch:sync:v1    — { repo, branch, token }
//   ch:meta:v1    — { shas, pendentes, ultimoSync, ultimoErro }

import type { Estado } from '../domain/tipos';
import { migrarEstado } from '../domain/migracoes';
import { estadoVazio } from '../domain/tipos';

const CHAVE_ESTADO = 'ch:estado:v1';
const CHAVE_SYNC = 'ch:sync:v1';
const CHAVE_META = 'ch:meta:v1';

export interface ConfigSync {
  repo: string;
  branch: string;
  token: string;
}

export interface Meta {
  shas: Record<string, string>;
  pendentes: string[];
  ultimoSync: number | null;
  ultimoErro: string | null;
}

function metaVazia(): Meta {
  return { shas: {}, pendentes: [], ultimoSync: null, ultimoErro: null };
}

/**
 * Carrega o estado do localStorage. (R-32: síncrono, antes do primeiro render.)
 * R-34: se corrompido, NÃO apaga — lança erro para a UI mostrar.
 */
export function carregarEstado(): Estado {
  const bruto = localStorage.getItem(CHAVE_ESTADO);
  if (!bruto) return estadoVazio();
  try {
    const obj = JSON.parse(bruto);
    return migrarEstado(obj);
  } catch (e) {
    throw new Error(
      'Armazenamento local corrompido: ' +
        (e instanceof Error ? e.message : 'erro desconhecido') +
        '. Use o botão abaixo para baixar uma cópia do conteúdo bruto antes de limpar.',
    );
  }
}

export function salvarEstado(estado: Estado): void {
  localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
}

/** R-34: remove só a chave de estado (mantém sync e meta). */
export function limparEstado(): void {
  localStorage.removeItem(CHAVE_ESTADO);
}

/** R-34 (reiniciar): remove TODAS as chaves do app. Usado só em testes e recuperação de corrupção. */
export function limparTudo(): void {
  localStorage.removeItem(CHAVE_ESTADO);
  localStorage.removeItem(CHAVE_SYNC);
  localStorage.removeItem(CHAVE_META);
}

export function carregarSync(): ConfigSync | null {
  const bruto = localStorage.getItem(CHAVE_SYNC);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as ConfigSync;
  } catch {
    return null;
  }
}

export function salvarSync(config: ConfigSync): void {
  localStorage.setItem(CHAVE_SYNC, JSON.stringify(config));
}

export function limparSync(): void {
  localStorage.removeItem(CHAVE_SYNC);
}

export function carregarMeta(): Meta {
  const bruto = localStorage.getItem(CHAVE_META);
  if (!bruto) return metaVazia();
  try {
    const obj = JSON.parse(bruto) as Partial<Meta>;
    return {
      shas: obj.shas ?? {},
      pendentes: obj.pendentes ?? [],
      ultimoSync: obj.ultimoSync ?? null,
      ultimoErro: obj.ultimoErro ?? null,
    };
  } catch {
    return metaVazia();
  }
}

export function salvarMeta(meta: Meta): void {
  localStorage.setItem(CHAVE_META, JSON.stringify(meta));
}

/** R-34: baixa cópia do conteúdo bruto de todas as chaves para diagnóstico. */
export function baixarBackupBruto(): string {
  const partes: string[] = [];
  partes.push('=== ch:estado:v1 ===');
  partes.push(localStorage.getItem(CHAVE_ESTADO) ?? '(vazio)');
  partes.push('');
  partes.push('=== ch:sync:v1 ===');
  partes.push(localStorage.getItem(CHAVE_SYNC) ?? '(vazio)');
  partes.push('');
  partes.push('=== ch:meta:v1 ===');
  partes.push(localStorage.getItem(CHAVE_META) ?? '(vazio)');
  return partes.join('\n');
}

// ===== Copiar e colar configuração (R-53) =====

/**
 * R-53: gera uma linha em base64 com { repo, branch, token }.
 * Para colar no segundo aparelho e evitar digitar o token duas vezes.
 */
export function copiarConfiguracao(): string {
  const sync = carregarSync();
  if (!sync) return '';
  const json = JSON.stringify(sync);
  // base64 seguro para UTF-8
  const bytes = new TextEncoder().encode(json);
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario);
}

/**
 * R-53: decodifica uma linha base64 e preenche a configuração de sync.
 * Testa validade retornando erro se inválido.
 */
export function colarConfiguracao(linha: string): { ok: boolean; erro?: string; config?: ConfigSync } {
  try {
    const binario = atob(linha.trim());
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const config = JSON.parse(json) as ConfigSync;
    if (!config.repo || !config.branch || !config.token) {
      return { ok: false, erro: 'Configuração incompleta' };
    }
    salvarSync(config);
    return { ok: true, config };
  } catch (e) {
    return { ok: false, erro: 'Base64 inválido: ' + (e instanceof Error ? e.message : '?') };
  }
}
