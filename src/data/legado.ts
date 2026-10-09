// Importação do histórico antigo. Implementado no M5. (R-49)
//
// M5 vai baixar o backup.txt do commit 2e4bc877... do repositório antigo
// e converter para o formato novo.

export interface LegadoBackup {
  alunos: unknown[];
  turmas: unknown[];
  aulas: unknown[];
  cronograma: unknown[];
  fechamentos: unknown[];
}

const URL_LEGADO = 'https://raw.githubusercontent.com/superaplicativos/Controle-de-Horas/2e4bc877a021361527588bdfebd65d223bd59f5c/data/backup.txt';

/** M5: baixa e converte o backup legado. */
export async function baixarLegado(): Promise<LegadoBackup> {
  throw new Error('NAO_IMPLEMENTADO: baixarLegado (M5)');
  void URL_LEGADO;
}

/** M5: converte formato legado para o atual. */
export function converterLegado(_backup: unknown): LegadoBackup {
  throw new Error('NAO_IMPLEMENTADO: converterLegado (M5)');
}
