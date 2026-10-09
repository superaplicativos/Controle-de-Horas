// Migrações de formato. (R-19, R-68)
import { VERSAO_FORMATO_ATUAL, type Estado, estadoVazio } from './tipos';

/**
 * Migra um estado para a versão atual do formato. (R-19)
 *
 * Se a versão for MAIOR que a atual, recusa com erro explicativo.
 * Nunca tenta adivinhar — o usuário precisa saber que o app está desatualizado.
 */
export function migrarEstado(estadoDesconhecido: unknown): Estado {
  if (!estadoDesconhecido || typeof estadoDesconhecido !== 'object') {
    throw new Error('NAO_IMPLEMENTADO: estado inválido (não é objeto)');
  }
  const obj = estadoDesconhecido as { versaoFormato?: unknown };
  const versao = obj.versaoFormato;

  if (typeof versao !== 'number') {
    throw new Error('estado inválido: versaoFormato ausente');
  }

  if (versao > VERSAO_FORMATO_ATUAL) {
    throw new Error(
      `versaoFormato ${versao} é maior que a suportada (${VERSAO_FORMATO_ATUAL}). ` +
        'Atualize o app.',
    );
  }

  // Versão 1 → 1: sem migração necessária.
  if (versao === 1) {
    return obj as Estado;
  }

  // Versões futuras terão seus migradores aqui.
  // Por enquanto, qualquer versão não tratada vira estado vazio com aviso.
  console.warn(`versaoFormato ${versao} sem migrador, começando do zero`);
  return estadoVazio();
}
