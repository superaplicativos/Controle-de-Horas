// Importação do histórico antigo. (R-49)
//
// Baixa o backup.txt do commit 2e4bc877... do repositório antigo (Next.js)
// e converte para o formato atual, mesclando com o estado local.

import { importarEstadoBruto } from './backup';

const URL_LEGADO = 'https://raw.githubusercontent.com/superaplicativos/Controle-de-Horas/2e4bc877a021361527588bdfebd65d223bd59f5c/data/backup.txt';

/**
 * R-49: baixa o backup legado do repositório antigo, extrai o JSON e importa.
 *
 * Resultado esperado hoje: 27 aulas, 9 alunos e as turmas.
 * Importar duas vezes não duplica (idempotente via mescla por id).
 */
export async function baixarEImportarLegado(): Promise<{ alteracoes: number; erro?: string }> {
  try {
    const resp = await fetch(`${URL_LEGADO}?t=${Date.now()}`, { cache: 'no-store' });
    if (!resp.ok) {
      return { alteracoes: 0, erro: `HTTP ${resp.status} ao baixar backup legado` };
    }
    const conteudo = await resp.text();

    // Extrai o JSON entre os marcadores
    const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
    if (!match?.[1]) {
      return { alteracoes: 0, erro: 'Backup legado não tem seção JSON COMPLETO' };
    }

    let obj: unknown;
    try {
      obj = JSON.parse(match[1].trim());
    } catch (e) {
      return { alteracoes: 0, erro: 'JSON inválido no backup legado: ' + (e instanceof Error ? e.message : '?') };
    }

    return importarEstadoBruto(obj);
  } catch (e) {
    return { alteracoes: 0, erro: 'Erro ao baixar legado: ' + (e instanceof Error ? e.message : '?') };
  }
}
