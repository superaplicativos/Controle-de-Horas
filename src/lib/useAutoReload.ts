'use client';

/**
 * NO-OP. Não recarrega nada automaticamente.
 * Botão "Atualizar" é a única forma de recarregar dados.
 */
export function useAutoReload(_carregar: () => void | Promise<void>) {}
