// Mescla de registros. Função pura. (R-44, R-45, R-46)
import type { Config, Registro } from './tipos';

/**
 * Mescla duas listas de registros por id. (R-44)
 *
 * - União por id.
 * - Se o id existe nos dois lados, vence o maior atualizadoEm.
 * - Empate vence o remoto.
 * - Lápide é registro normal e vence se for a mais recente. (R-46)
 * - Registro só local ou só remoto permanece.
 * - Saída ordenada por id para ser estável.
 *
 * Propriedades (R-45): comutatividade, idempotência, nenhum registro some.
 */
export function mesclarRegistros<T extends Registro>(local: T[], remoto: T[]): T[] {
  const mapa = new Map<string, T>();

  for (const r of local) {
    mapa.set(r.id, r);
  }
  for (const r of remoto) {
    const existente = mapa.get(r.id);
    if (!existente) {
      mapa.set(r.id, r);
    } else {
      // Vence o maior atualizadoEm; empate vence o remoto.
      if (r.atualizadoEm >= existente.atualizadoEm) {
        mapa.set(r.id, r);
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Mescla duas configurações. (R-44) Vence o maior atualizadoEm; empate vence o remoto.
 */
export function mesclarConfig(local: Config, remoto: Config): Config {
  if (remoto.atualizadoEm >= local.atualizadoEm) return remoto;
  return local;
}
