'use client';

/**
 * NO-OP: não faz nada.
 * O sync manual (botão Atualizar) é a única forma de recarregar dados.
 * Isso previne loops infinitos e piscar da tela.
 */
export function useAutoReload(_carregar: () => void | Promise<void>) {
  // Não faz nada. Intencional.
}
