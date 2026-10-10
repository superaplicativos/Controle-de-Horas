// Motor de sincronização com cifragem. (R-29, R-42, R-43, R-47, R-73, R-74, R-75)
//
// P-02: a sincronização só MESCLA. Nunca substitui o local por completo.
// R-43: proibido limpar o estado local antes de importar.
// R-42: no máximo um ciclo em execução.
// R-73: toda cifra/decifra passa por data/cripto.ts.
// R-74: IV aleatório novo a cada escrita.
// R-75: a mescla acontece DEPOIS de decifrar; a decisão de enviar usa o texto claro.
//
// Layout dos arquivos (seção 11.1 + 24.4):
//   dados/acesso.txt        — AcessoCifrado (chave derivada de senha)
//   dados/config.txt        — ArquivoCifrado (chave de dados K)
//   dados/cadastros.txt     — ArquivoCifrado
//   dados/cronograma.txt    — ArquivoCifrado
//   dados/fechamentos.txt   — ArquivoCifrado
//   dados/aulas/AAAA-MM.txt — ArquivoCifrado

import type { Estado, Aula, Aluno, Turma, CronogramaItem, Fechamento, Config } from '../domain/tipos';
import { mesclarRegistros, mesclarConfig } from '../domain/mescla';
import { useStore } from '../store/store';
import { salvarEstado, salvarMeta, carregarSync } from './storage';
import {
  listarArquivos,
  baixarArquivo,
  salvarArquivo,
  criarBranchDados,
  type ConteudoArquivo,
} from './github';
import {
  cifrarArquivo,
  decifrarArquivo,
  importarChaveDados,
  base64ParaChaveDados,
  type ArquivoCifrado,
} from './cripto';

export const CAMINHO_CONFIG = 'dados/config.txt';
export const CAMINHO_CADASTROS = 'dados/cadastros.txt';
export const CAMINHO_CRONOGRAMA = 'dados/cronograma.txt';
export const CAMINHO_FECHAMENTOS = 'dados/fechamentos.txt';

export function caminhoAulaMes(mesRef: string): string {
  return `dados/aulas/${mesRef}.txt`;
}

// ===== Estado do motor =====

let cicloEmAndamento = false;
let rodarDeNovo = false;
let ultimaPromise: Promise<void> = Promise.resolve();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ===== Status =====

export interface StatusSync {
  status: 'ocioso' | 'sincronizando' | 'sincronizado' | 'erro';
  ultimoSync: number | null;
  ultimoErro: string | null;
  arquivosPendentes: number;
}

let ouvintesStatus: Array<(s: StatusSync) => void> = [];
let statusAtual: StatusSync = {
  status: 'ocioso',
  ultimoSync: null,
  ultimoErro: null,
  arquivosPendentes: 0,
};

function notificarStatus() {
  for (const fn of ouvintesStatus) fn(statusAtual);
}

export function subscribeStatus(fn: (s: StatusSync) => void): () => void {
  ouvintesStatus.push(fn);
  fn(statusAtual);
  return () => {
    ouvintesStatus = ouvintesStatus.filter((f) => f !== fn);
  };
}

function setStatus(parcial: Partial<StatusSync>) {
  statusAtual = { ...statusAtual, ...parcial };
  notificarStatus();
}

/** R-41: debounce 2s após mutação. Agenda um ciclo. */
export function agendarSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    sincronizar().catch((e: unknown) => console.error('sync agendado:', e));
  }, 2000);
}

/** R-42: mutex. Pedidos durante um ciclo viram UM ciclo seguinte. */
export async function sincronizar(): Promise<void> {
  if (cicloEmAndamento) {
    rodarDeNovo = true;
    return ultimaPromise;
  }
  cicloEmAndamento = true;
  ultimaPromise = executarCiclo();
  try {
    await ultimaPromise;
  } finally {
    cicloEmAndamento = false;
    if (rodarDeNovo) {
      rodarDeNovo = false;
      await sincronizar();
    }
  }
  return ultimaPromise;
}

// ===== Serialização por arquivo (texto claro) =====

interface ArquivoConfig { versaoFormato: number; config: Config; }
interface ArquivoCadastros { versaoFormato: number; alunos: Aluno[]; turmas: Turma[]; }
interface ArquivoAulas { versaoFormato: number; aulas: Aula[]; }
interface ArquivoCronograma { versaoFormato: number; cronograma: CronogramaItem[]; }
interface ArquivoFechamentos { versaoFormato: number; fechamentos: Fechamento[]; }

function parseSeguro<T>(texto: string, fallback: T): T {
  if (!texto) return fallback;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return fallback;
  }
}

/** Converte estado para mapa de caminho → texto claro. */
function estadoParaTextosClaros(estado: Estado): Map<string, string> {
  const arquivos = new Map<string, string>();
  arquivos.set(CAMINHO_CONFIG, JSON.stringify({
    versaoFormato: estado.versaoFormato, config: estado.config,
  } satisfies ArquivoConfig, null, 2));
  arquivos.set(CAMINHO_CADASTROS, JSON.stringify({
    versaoFormato: estado.versaoFormato, alunos: estado.alunos, turmas: estado.turmas,
  } satisfies ArquivoCadastros, null, 2));
  arquivos.set(CAMINHO_CRONOGRAMA, JSON.stringify({
    versaoFormato: estado.versaoFormato, cronograma: estado.cronograma,
  } satisfies ArquivoCronograma, null, 2));
  arquivos.set(CAMINHO_FECHAMENTOS, JSON.stringify({
    versaoFormato: estado.versaoFormato, fechamentos: estado.fechamentos,
  } satisfies ArquivoFechamentos, null, 2));

  const aulasPorMes = new Map<string, Aula[]>();
  for (const a of estado.aulas) {
    const arr = aulasPorMes.get(a.mesRef) ?? [];
    arr.push(a);
    aulasPorMes.set(a.mesRef, arr);
  }
  for (const [mesRef, aulas] of aulasPorMes) {
    arquivos.set(caminhoAulaMes(mesRef), JSON.stringify({
      versaoFormato: estado.versaoFormato, aulas,
    } satisfies ArquivoAulas, null, 2));
  }
  return arquivos;
}

/**
 * Mescla textos claros remotos no estado local. Retorna novo estado.
 * R-43: nunca apaga local. R-44: mescla por id.
 */
function mesclarTextosRemotos(estadoLocal: Estado, remotos: Map<string, string>): Estado {
  const { versaoFormato, turmas: turmasLocal } = estadoLocal;
  let config = estadoLocal.config;
  let alunos = estadoLocal.alunos;
  let turmas = turmasLocal;
  const aulas = estadoLocal.aulas;
  let cronograma = estadoLocal.cronograma;
  let fechamentos = estadoLocal.fechamentos;

  const textoConfig = remotos.get(CAMINHO_CONFIG);
  if (textoConfig) {
    const obj = parseSeguro<ArquivoConfig | null>(textoConfig, null);
    if (obj?.config) config = mesclarConfig(config, obj.config);
  }

  const textoCadastros = remotos.get(CAMINHO_CADASTROS);
  if (textoCadastros) {
    const obj = parseSeguro<ArquivoCadastros | null>(textoCadastros, null);
    if (obj) {
      alunos = mesclarRegistros(alunos, obj.alunos ?? []);
      turmas = mesclarRegistros(turmas, obj.turmas ?? []);
    }
  }

  const textoCronograma = remotos.get(CAMINHO_CRONOGRAMA);
  if (textoCronograma) {
    const obj = parseSeguro<ArquivoCronograma | null>(textoCronograma, null);
    if (obj) cronograma = mesclarRegistros(cronograma, obj.cronograma ?? []);
  }

  const textoFechamentos = remotos.get(CAMINHO_FECHAMENTOS);
  if (textoFechamentos) {
    const obj = parseSeguro<ArquivoFechamentos | null>(textoFechamentos, null);
    if (obj) fechamentos = mesclarRegistros(fechamentos, obj.fechamentos ?? []);
  }

  // aulas: um arquivo por mês
  const aulasMescladas: Aula[] = [];
  const mesesLocais = new Set(aulas.map((a) => a.mesRef));
  const mesesRemotos = new Set<string>();

  for (const [caminho, texto] of remotos) {
    if (!caminho.startsWith('dados/aulas/')) continue;
    const obj = parseSeguro<ArquivoAulas | null>(texto, null);
    if (!obj) continue;
    const mesRef = caminho.replace('dados/aulas/', '').replace('.txt', '');
    mesesRemotos.add(mesRef);
    const locaisDoMes = aulas.filter((a) => a.mesRef === mesRef);
    aulasMescladas.push(...mesclarRegistros(locaisDoMes, obj.aulas ?? []));
  }

  for (const mesRef of mesesLocais) {
    if (!mesesRemotos.has(mesRef)) {
      aulasMescladas.push(...aulas.filter((a) => a.mesRef === mesRef));
    }
  }

  const dedup = new Map<string, Aula>();
  for (const a of aulasMescladas) {
    const existente = dedup.get(a.id);
    if (!existente || a.atualizadoEm > existente.atualizadoEm) dedup.set(a.id, a);
  }

  return {
    versaoFormato, config, alunos, turmas,
    aulas: Array.from(dedup.values()).sort((a, b) => a.id.localeCompare(b.id)),
    cronograma, fechamentos,
  };
}

// ===== Decifração de ConteudoArquivo → texto claro =====

async function decifrarConteudoRemoto(
  cont: ConteudoArquivo,
  caminho: string,
  chave: CryptoKey,
): Promise<string | null> {
  if (!cont.conteudo) return null;
  let arqCifrado: ArquivoCifrado;
  try {
    arqCifrado = JSON.parse(cont.conteudo) as ArquivoCifrado;
  } catch {
    return cont.conteudo;
  }
  if (!arqCifrado.iv || !arqCifrado.ct) {
    return cont.conteudo;
  }
  try {
    return await decifrarArquivo(chave, arqCifrado, caminho);
  } catch {
    console.warn(`Arquivo corrompido ou alterado: ${caminho}`);
    return null;
  }
}

// ===== Ciclo de sync =====

async function executarCiclo(): Promise<void> {
  const syncConfig = carregarSync();
  if (!syncConfig || !syncConfig.token || !syncConfig.chaveDados) {
    setStatus({ status: 'ocioso', ultimoErro: null, arquivosPendentes: 0 });
    return;
  }

  const { repo, branch, token, chaveDados } = syncConfig;
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    setStatus({ status: 'erro', ultimoErro: 'Repositório inválido (use owner/repo)' });
    return;
  }

  setStatus({ status: 'sincronizando', ultimoErro: null });

  try {
    // Importa a chave de dados
    const chaveBytes = base64ParaChaveDados(chaveDados);
    const chave = await importarChaveDados(chaveBytes);

    // R-39: garante que a branch `dados` existe
    await criarBranchDados(owner, repoName, branch, token);

    // Lista arquivos remotos
    const caminhosRemotos: string[] = [];
    caminhosRemotos.push(...await listarArquivos(owner, repoName, branch, 'dados', token));
    caminhosRemotos.push(...await listarArquivos(owner, repoName, branch, 'dados/aulas', token));

    const { meta } = useStore.getState();
    const shasLocais = meta.shas;
    const pendentes = meta.pendentes;

    // Baixa todos os arquivos remotos
    const paraBaixar = new Set<string>(caminhosRemotos);
    for (const caminho of pendentes) paraBaixar.add(caminho);

    const remotosCifrados = new Map<string, ConteudoArquivo>();
    for (const caminho of paraBaixar) {
      const cont = await baixarArquivo(owner, repoName, branch, caminho, token);
      remotosCifrados.set(caminho, cont);
    }

    // Decifra todos os arquivos remotos → textos claros
    const textosRemotos = new Map<string, string>();
    for (const [caminho, cont] of remotosCifrados) {
      if (caminho === 'dados/acesso.txt') continue; // acesso.txt não é dado de negócio
      const textoClaro = await decifrarConteudoRemoto(cont, caminho, chave);
      if (textoClaro !== null) textosRemotos.set(caminho, textoClaro);
    }

    // Mescla textos claros no estado local
    const estadoLocal = useStore.getState();
    const { meta: _m, erroCorrupcao: _e, ...estadoPuro } = estadoLocal;
    void _m;
    void _e;
    const estadoMesclado = mesclarTextosRemotos(estadoPuro, textosRemotos);

    useStore.setState({
      ...estadoMesclado,
      meta: estadoLocal.meta,
      erroCorrupcao: estadoLocal.erroCorrupcao,
    });
    salvarEstado(estadoMesclado);

    // Atualiza shas
    const novosShas: Record<string, string> = { ...shasLocais };
    for (const [caminho, cont] of remotosCifrados) {
      if (cont.sha) novosShas[caminho] = cont.sha;
    }

    // Envia arquivos cujo texto claro difere do remoto
    const textosLocais = estadoParaTextosClaros(estadoMesclado);
    const pendentesAinda: string[] = [];

    for (const caminho of textosLocais.keys()) {
      const textoClaroLocal = textosLocais.get(caminho) ?? '';
      const textoClaroRemoto = textosRemotos.get(caminho) ?? '';

      // R-75: compara texto claro, não cifrado
      if (textoClaroLocal === textoClaroRemoto && !pendentes.includes(caminho)) {
        continue;
      }

      // Cifra o texto claro local (R-74: IV novo a cada escrita)
      const cifrado = await cifrarArquivo(chave, textoClaroLocal, caminho);
      const conteudoCifradoJson = JSON.stringify(cifrado);

      let sucesso = false;
      for (let tentativa = 0; tentativa < 3; tentativa++) {
        try {
          const shaAtual = novosShas[caminho] ?? null;
          const novoSha = await salvarArquivo(owner, repoName, branch, caminho, conteudoCifradoJson, shaAtual, token);
          novosShas[caminho] = novoSha;
          sucesso = true;
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.startsWith('CONFLITO')) {
            const cont = await baixarArquivo(owner, repoName, branch, caminho, token);
            novosShas[caminho] = cont.sha ?? novosShas[caminho] ?? '';
            const textoRe = await decifrarConteudoRemoto(cont, caminho, chave);
            if (textoRe !== null) {
              const estadoRe = useStore.getState();
              const { meta: _m2, erroCorrupcao: _e2, ...estadoPuro2 } = estadoRe;
              void _m2;
              void _e2;
              const reMesclado = mesclarTextosRemotos(estadoPuro2, new Map([[caminho, textoRe]]));
              useStore.setState({ ...reMesclado, meta: estadoRe.meta, erroCorrupcao: estadoRe.erroCorrupcao });
              salvarEstado(reMesclado);
            }
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            throw err;
          }
        }
      }
      if (!sucesso) pendentesAinda.push(caminho);
      await new Promise((r) => setTimeout(r, 1000));
    }

    const novaMeta = {
      shas: novosShas,
      pendentes: pendentesAinda,
      ultimoSync: Date.now(),
      ultimoErro: null,
    };
    salvarMeta(novaMeta);
    useStore.setState({ meta: novaMeta });

    setStatus({
      status: pendentesAinda.length > 0 ? 'erro' : 'sincronizado',
      ultimoSync: novaMeta.ultimoSync,
      ultimoErro: pendentesAinda.length > 0 ? `${pendentesAinda.length} arquivo(s) não sincronizado(s)` : null,
      arquivosPendentes: pendentesAinda.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    setStatus({ status: 'erro', ultimoErro: msg });
    const { meta } = useStore.getState();
    salvarMeta({ ...meta, ultimoErro: msg });
  }
}

/** Força nova leitura da nuvem: zera os shas guardados. Nunca apaga dado local. */
export function relerNuvem(): void {
  const { meta } = useStore.getState();
  const novaMeta = { ...meta, shas: {} as Record<string, string> };
  salvarMeta(novaMeta);
  useStore.setState({ meta: novaMeta });
}
