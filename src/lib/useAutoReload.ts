'use client';

/**
 * NO-OP. Não faz nada. Previne loops.
 * O usuário recarrega dados manualmente (botão Atualizar).
 */
export function useAutoReload(_carregar: () => void | Promise<void>) {}
