// Importação do histórico antigo. (R-49)
//
// Baixa o backup inicial do repositório (30 aulas, 10 alunos, R$ 1960)
// e mescla com o estado local.

import { importarEstadoBruto } from './backup';

// Backup com 30 aulas (27 originais + 3 da Raquel Ribeiro), total R$ 1960.
// Arquivo no próprio repositório, branch main, pasta docs.
const URL_BACKUP_INICIAL = 'https://raw.githubusercontent.com/superaplicativos/Controle-de-Horas/main/docs/dados-iniciais.txt';

/**
 * R-49: baixa o backup inicial, extrai o JSON e importa.
 *
 * Resultado: 30 aulas, 10 alunos, 3 turmas, total R$ 1960.
 * Importar duas vezes não duplica (idempotente via mescla por id).
 */
export async function baixarEImportarLegado(): Promise<{ alteracoes: number; erro?: string }> {
  try {
    const resp = await fetch(`${URL_BACKUP_INICIAL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!resp.ok) {
      return { alteracoes: 0, erro: `HTTP ${resp.status} ao baixar backup inicial` };
    }
    const conteudo = await resp.text();

    // Extrai o JSON entre os marcadores
    const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
    if (!match?.[1]) {
      return { alteracoes: 0, erro: 'Backup não tem seção JSON COMPLETO' };
    }

    let obj: unknown;
    try {
      obj = JSON.parse(match[1].trim());
    } catch (e) {
      return { alteracoes: 0, erro: 'JSON inválido no backup: ' + (e instanceof Error ? e.message : '?') };
    }

    return importarEstadoBruto(obj);
  } catch (e) {
    return { alteracoes: 0, erro: 'Erro ao baixar backup: ' + (e instanceof Error ? e.message : '?') };
  }
}
