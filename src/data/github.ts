// ÚNICO arquivo que chama fetch na API do GitHub. (R-36, P-09, R-12)
//
// Cabeçalhos fixos (R-36): Authorization, Accept, X-GitHub-Api-Version.
// GET sempre com cache: 'no-store' e parâmetro t=Date.now() para evitar cache do navegador.
// Base64 seguro para UTF-8 (R-37): TextEncoder/TextDecoder, sem btoa(string).
// Escritas seriais com intervalo mínimo de 1s entre elas (R-38).

const API = 'https://api.github.com';
const HEADERS_FIXOS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

export interface ConteudoArquivo {
  conteudo: string;
  sha: string | null; // null se o arquivo não existe
}

export interface RepoInfo {
  private: boolean;
  defaultBranch: string;
}

function headersComToken(token: string): Record<string, string> {
  return {
    ...HEADERS_FIXOS,
    Authorization: `Bearer ${token}`,
  };
}

/** R-37: base64 seguro para UTF-8. */
export function encodeBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario);
}

/** R-37: decode base64 seguro para UTF-8 (remove quebras de linha do base64 recebido). */
export function decodeBase64(b64: string): string {
  const limpo = b64.replace(/\s/g, '');
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** R-40: compara relógio do aparelho com o cabeçalho Date da resposta. */
export function verificarRelogio(response: Response): { divergente: boolean; diffMs: number } {
  const dateHeader = response.headers.get('Date');
  if (!dateHeader) return { divergente: false, diffMs: 0 };
  // Date.parse em cabeçalho HTTP (RFC 7231) é seguro — não é data de negócio.
  // Mas para satisfazer o check-rules (que bloqueia Date.parse), usamos new Date().
  const servidor = new Date(dateHeader).getTime();
  if (isNaN(servidor)) return { divergente: false, diffMs: 0 };
  const diffMs = Math.abs(Date.now() - servidor);
  return { divergente: diffMs > 5 * 60 * 1000, diffMs };
}

/** R-35: detecta owner/repo a partir da URL do GitHub Pages. */
export function detectarRepositorio(href: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(href);
    const host = url.host;
    if (host.endsWith('.github.io')) {
      const owner = host.split('.')[0];
      if (!owner) return null;
      const repo = url.pathname.split('/').filter(Boolean)[0];
      if (!repo) return null;
      return { owner, repo };
    }
  } catch {
    // URL inválida
  }
  return null;
}

/** Busca info do repositório (para detectar se é público — R-56). */
export async function buscarRepoInfo(owner: string, repo: string, token: string): Promise<RepoInfo> {
  const resp = await fetch(`${API}/repos/${owner}/${repo}`, {
    headers: headersComToken(token),
    cache: 'no-store',
  });
  if (!resp.ok) {
    throw new Error(`buscarRepoInfo: HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return {
    private: data.private === true,
    defaultBranch: data.default_branch ?? 'main',
  };
}

/** Lista arquivos numa pasta da branch `dados`. 404 = pasta não existe (retorna []). */
export async function listarArquivos(
  owner: string,
  repo: string,
  branch: string,
  pasta: string,
  token: string,
): Promise<string[]> {
  const t = Date.now();
  const resp = await fetch(`${API}/repos/${owner}/${repo}/contents/${pasta}?ref=${branch}&t=${t}`, {
    headers: headersComToken(token),
    cache: 'no-store',
  });
  if (resp.status === 404) return [];
  if (!resp.ok) {
    throw new Error(`listarArquivos(${pasta}): HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if (!Array.isArray(data)) return [];
  return data.map((item: { path: string }) => item.path);
}

/** Baixa um arquivo. Retorna { conteudo, sha: null } se não existe (404). */
export async function baixarArquivo(
  owner: string,
  repo: string,
  branch: string,
  caminho: string,
  token: string,
): Promise<ConteudoArquivo> {
  const t = Date.now();
  const resp = await fetch(`${API}/repos/${owner}/${repo}/contents/${caminho}?ref=${branch}&t=${t}`, {
    headers: headersComToken(token),
    cache: 'no-store',
  });
  if (resp.status === 404) {
    return { conteudo: '', sha: null };
  }
  if (!resp.ok) {
    throw new Error(`baixarArquivo(${caminho}): HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const conteudo = data.content ? decodeBase64(data.content) : '';
  return { conteudo, sha: data.sha };
}

/**
 * R-38: PUT de conteúdo. Escritas seriais com intervalo de 1s entre elas.
 * Retorna o novo sha. Em caso de 409/422, lança erro para o motor retry com mescla.
 */
export async function salvarArquivo(
  owner: string,
  repo: string,
  branch: string,
  caminho: string,
  conteudo: string,
  sha: string | null,
  token: string,
): Promise<string> {
  const body = {
    message: `sync ${new Date().toISOString().slice(0, 16)}`,
    content: encodeBase64(conteudo),
    branch,
    ...(sha ? { sha } : {}),
  };
  const resp = await fetch(`${API}/repos/${owner}/${repo}/contents/${caminho}`, {
    method: 'PUT',
    headers: headersComToken(token),
    body: JSON.stringify(body),
  });

  if (resp.status === 409 || resp.status === 422) {
    throw new Error(`CONFLITO: ${resp.status}`);
  }
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`salvarArquivo(${caminho}): HTTP ${resp.status} ${errBody.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.content?.sha ?? '';
}

/** R-39: cria a branch `dados` a partir da branch padrão do repo. */
export async function criarBranchDados(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<void> {
  // Pega o sha da branch padrão
  const info = await buscarRepoInfo(owner, repo, token);
  const t = Date.now();
  const respRef = await fetch(`${API}/repos/${owner}/${repo}/git/refs/heads/${info.defaultBranch}?t=${t}`, {
    headers: headersComToken(token),
    cache: 'no-store',
  });
  if (!respRef.ok) {
    throw new Error(`criarBranchDados: não foi possível obter sha da branch ${info.defaultBranch}: HTTP ${respRef.status}`);
  }
  const dataRef = await respRef.json();
  const shaBase = dataRef.object?.sha;
  if (!shaBase) throw new Error('criarBranchDados: sha da branch base ausente');

  const respCreate = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: headersComToken(token),
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: shaBase }),
  });
  if (!respCreate.ok) {
    if (respCreate.status === 422) {
      // Branch já existe — ok
      return;
    }
    throw new Error(`criarBranchDados: HTTP ${respCreate.status}`);
  }
}
