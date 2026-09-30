// Crypto utilities - SHA-256 + salt (client-side, sem servidor)

export function gerarSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSenha(senha: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}::${senha}::controle-aulas-v1`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verificarSenha(senha: string, salt: string, hashEsperado: string): Promise<boolean> {
  const hashAtual = await hashSenha(senha, salt);
  return hashAtual === hashEsperado;
}

export function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
