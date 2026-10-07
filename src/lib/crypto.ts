// Utilitários de identificação.
// Senhas nunca mais são hasheadas no navegador — o Worker (D1) faz a validação.

export function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
