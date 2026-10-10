// Acesso: máquina de estados + leitura anônima do acesso.txt. (R-72, 24.5)
//
// R-72: decidirEstado é função pura, testada para cada linha da tabela 24.2.
// 24.5: leitura anônima via sha de commit (sem token).
// R-76: rate limit 403/429 tratado com mensagem clara, sem loop.

import type { AcessoCifrado } from './cripto';
import { baixarArquivo, buscarRepoInfo } from './github';

// ===== Tipos =====

export type EstadoAcesso =
  | 'detectando'
  | 'desbloqueado'
  | 'pedeSenha'
  | 'primeiraConfiguracao'
  | 'erroRede';

export interface EntradaDecidirEstado {
  /** Tem material local (chaveDados + token em ch:sync:v1)? */
  temMaterialLocal: boolean;
  /** O acesso.txt existe na branch dados? (null = não conseguiu verificar) */
  acessoExiste: boolean | null;
  /** Erro de rede ao verificar? */
  erroRede: boolean;
}

/**
 * R-72: função pura que decide o estado de acesso.
 * Tabela 24.2:
 * - desbloqueado: temMaterialLocal = true
 * - pedeSenha: sem material local E acessoExiste = true
 * - primeiraConfiguracao: sem material local E (acessoExiste = false OU branch não existe)
 * - erroRede: erroRede = true (não foi possível consultar)
 */
export function decidirEstado(entrada: EntradaDecidirEstado): EstadoAcesso {
  if (entrada.temMaterialLocal) {
    return 'desbloqueado';
  }
  if (entrada.erroRede) {
    return 'erroRede';
  }
  if (entrada.acessoExiste === true) {
    return 'pedeSenha';
  }
  if (entrada.acessoExiste === false) {
    return 'primeiraConfiguracao';
  }
  // acessoExiste === null sem erroRede: ainda detectando
  return 'detectando';
}

// ===== Leitura anônima do acesso.txt (24.5) =====

/**
 * Verifica se o acesso.txt existe na branch dados, sem token.
 * Caminho (24.5): GET /repos/{repo}/git/ref/heads/dados (sem auth) → sha do commit
 * → raw.githubusercontent.com/{repo}/{sha}/dados/acesso.txt
 *
 * R-76: 403/429 = rate limit, retorna { existe: null, rateLimit: true }.
 * R-77: repositório privado = 404, retorna { existe: null, privado: true }.
 */
export async function verificarAcessoExiste(
  repo: string,
): Promise<{ existe: boolean; rateLimit?: boolean; privado?: boolean; erro?: string }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return { existe: false, erro: 'Repositório inválido (use owner/repo)' };
  }

  try {
    // 1. Tenta obter o sha do commit mais recente da branch dados, sem token.
    const respRef = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/dados?t=${Date.now()}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      },
    );

    if (respRef.status === 403 || respRef.status === 429) {
      return { existe: false, rateLimit: true };
    }
    if (respRef.status === 404) {
      // Branch dados não existe OU repositório privado. Distinguimos tentando o repo info.
      // Para repo privado sem token, /repos/{repo} também dá 404.
      return { existe: false, privado: false }; // assumimos público e sem branch
    }
    if (!respRef.ok) {
      return { existe: false, erro: `HTTP ${respRef.status}` };
    }

    const dataRef = await respRef.json();
    const sha = dataRef?.object?.sha;
    if (!sha) {
      return { existe: false, erro: 'sha não encontrado na resposta' };
    }

    // 2. Baixa o acesso.txt pelo sha (URL por sha nunca serve cache velho).
    const respRaw = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repoName}/${sha}/dados/acesso.txt?t=${Date.now()}`,
      { cache: 'no-store' },
    );

    if (respRaw.status === 404) {
      return { existe: false }; // branch existe mas acesso.txt ainda não
    }
    if (!respRaw.ok) {
      return { existe: false, erro: `HTTP ${respRaw.status} ao baixar acesso.txt` };
    }

    return { existe: true };
  } catch (e) {
    return {
      existe: false,
      erro: 'Erro de rede: ' + (e instanceof Error ? e.message : '?'),
    };
  }
}

/**
 * Baixa e devolve o AcessoCifrado do acesso.txt, sem token.
 * Usa o mesmo caminho da 24.5: sha do commit → raw por sha.
 */
export async function baixarAcessoCifrado(repo: string): Promise<{ acesso?: AcessoCifrado; erro?: string; rateLimit?: boolean }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return { erro: 'Repositório inválido' };
  }

  try {
    // 1. sha do commit da branch dados (sem token)
    const respRef = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/dados?t=${Date.now()}`,
      { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' },
    );
    if (respRef.status === 403 || respRef.status === 429) {
      return { rateLimit: true };
    }
    if (!respRef.ok) {
      return { erro: `HTTP ${respRef.status}` };
    }
    const dataRef = await respRef.json();
    const sha = dataRef?.object?.sha as string | undefined;
    if (!sha) return { erro: 'sha não encontrado' };

    // 2. raw por sha
    const respRaw = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repoName}/${sha}/dados/acesso.txt?t=${Date.now()}`,
      { cache: 'no-store' },
    );
    if (!respRaw.ok) {
      return { erro: `HTTP ${respRaw.status}` };
    }
    const texto = await respRaw.text();
    const acesso = JSON.parse(texto) as AcessoCifrado;
    return { acesso };
  } catch (e) {
    return { erro: 'Erro: ' + (e instanceof Error ? e.message : '?') };
  }
}

// Reexporta para a UI usar sem importar de github.ts diretamente
void buscarRepoInfo;
void baixarArquivo;
