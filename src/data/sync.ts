// Motor de sincronização. Implementado no M4. (R-29)
//
// M2: as ações marcam arquivos como pendentes em ch:meta:v1.
// M4: este arquivo implementa o ciclo completo de sync (GET/PUT na API do GitHub).

/** Caminhos dos arquivos de dados na branch `dados`. (seção 11.1) */
export const CAMINHO_CONFIG = 'dados/config.txt';
export const CAMINHO_CADASTROS = 'dados/cadastros.txt';
export const CAMINHO_CRONOGRAMA = 'dados/cronograma.txt';
export const CAMINHO_FECHAMENTOS = 'dados/fechamentos.txt';

export function caminhoAulaMes(mesRef: string): string {
  return `dados/aulas/${mesRef}.txt`;
}

/** M4: agenda um ciclo de sync (debounce 2s, mutex). */
export function agendarSync(): void {
  throw new Error('NAO_IMPLEMENTADO: agendarSync (M4)');
}

/** M4: executa um ciclo de sync completo agora. */
export async function sincronizar(): Promise<void> {
  throw new Error('NAO_IMPLEMENTADO: sincronizar (M4)');
}
