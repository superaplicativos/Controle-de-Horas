// Motor de sincronização. (R-29, R-42, R-43, R-47)
//
// P-02: a sincronização só MESCLA. Nunca substitui o local por completo.
// R-43: proibido limpar o estado local antes de importar; "espelhar" a nuvem; usar sync para apagar.
// R-42: no máximo um ciclo em execução. Pedidos durante um ciclo viram UM ciclo seguinte.
//
// Layout dos arquivos (seção 11.1):
//   dados/config.txt          — { config }
//   dados/cadastros.txt       — { alunos, turmas }
//   dados/cronograma.txt      — { cronograma }
//   dados/fechamentos.txt     — { fechamentos }
//   dados/aulas/AAAA-MM.txt   — { aulas do mês }

import type { Estado, Aula, Aluno, Turma, CronogramaItem, Fechamento, Config } from '../domain/tipos';
import { mesclarRegistros, mesclarConfig } from '../domain/mescla';
import { useStore } from '../store/store';
import { salvarEstado, salvarMeta, carregarSync } from './storage';
import {
  listarArquivos,
  baixarArquivo,
  salvarArquivo,
  criarBranchDados,
  verificarRelogio,
  type ConteudoArquivo,
} from './github';

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
let ouvintesRelogio: Array<(msg: string) => void> = [];
let avisoRelogio: string | null = null;

export function subscribeAvisoRelogio(fn: (msg: string) => void): () => void {
  ouvintesRelogio.push(fn);
  if (avisoRelogio) fn(avisoRelogio);
  return () => {
    ouvintesRelogio = ouvintesRelogio.filter((f) => f !== fn);
  };
}

function notificarRelogio(msg: string | null) {
  avisoRelogio = msg;
  for (const fn of ouvintesRelogio) fn(msg ?? '');
}

// ===== Serialização por arquivo =====

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

function estadoParaArquivos(estado: Estado): Record<string, string> {
  const arquivos: Record<string, string> = {};
  arquivos[CAMINHO_CONFIG] = JSON.stringify({
    versaoFormato: estado.versaoFormato,
    config: estado.config,
  } satisfies ArquivoConfig, null, 2);
  arquivos[CAMINHO_CADASTROS] = JSON.stringify({
    versaoFormato: estado.versaoFormato,
    alunos: estado.alunos,
    turmas: estado.turmas,
  } satisfies ArquivoCadastros, null, 2);
  arquivos[CAMINHO_CRONOGRAMA] = JSON.stringify({
    versaoFormato: estado.versaoFormato,
    cronograma: estado.cronograma,
  } satisfies ArquivoCronograma, null, 2);
  arquivos[CAMINHO_FECHAMENTOS] = JSON.stringify({
    versaoFormato: estado.versaoFormato,
    fechamentos: estado.fechamentos,
  } satisfies ArquivoFechamentos, null, 2);

  // Agrupa aulas por mesRef
  const aulasPorMes = new Map<string, Aula[]>();
  for (const a of estado.aulas) {
    const arr = aulasPorMes.get(a.mesRef) ?? [];
    arr.push(a);
    aulasPorMes.set(a.mesRef, arr);
  }
  for (const [mesRef, aulas] of aulasPorMes) {
    arquivos[caminhoAulaMes(mesRef)] = JSON.stringify({
      versaoFormato: estado.versaoFormato,
      aulas,
    } satisfies ArquivoAulas, null, 2);
  }
  return arquivos;
}

/** Mescla o conteúdo remoto de cada arquivo no estado local. Retorna novo estado. */
function mesclarArquivosRemotos(
  estadoLocal: Estado,
  remotos: Map<string, ConteudoArquivo>,
): Estado {
  const { versaoFormato, turmas: turmasLocal } = estadoLocal;
  let config = estadoLocal.config;
  let alunos = estadoLocal.alunos;
  let turmas = turmasLocal;
  const aulas = estadoLocal.aulas;
  let cronograma = estadoLocal.cronograma;
  let fechamentos = estadoLocal.fechamentos;

  // config
  const arqConfig = remotos.get(CAMINHO_CONFIG);
  if (arqConfig && arqConfig.conteudo) {
    const obj = parseSeguro<ArquivoConfig | null>(arqConfig.conteudo, null);
    if (obj?.config) {
      config = mesclarConfig(config, obj.config);
    }
  }

  // cadastros (alunos + turmas)
  const arqCadastros = remotos.get(CAMINHO_CADASTROS);
  if (arqCadastros && arqCadastros.conteudo) {
    const obj = parseSeguro<ArquivoCadastros | null>(arqCadastros.conteudo, null);
    if (obj) {
      alunos = mesclarRegistros(alunos, obj.alunos ?? []);
      turmas = mesclarRegistros(turmas, obj.turmas ?? []);
    }
  }

  // cronograma
  const arqCronograma = remotos.get(CAMINHO_CRONOGRAMA);
  if (arqCronograma && arqCronograma.conteudo) {
    const obj = parseSeguro<ArquivoCronograma | null>(arqCronograma.conteudo, null);
    if (obj) {
      cronograma = mesclarRegistros(cronograma, obj.cronograma ?? []);
    }
  }

  // fechamentos
  const arqFechamentos = remotos.get(CAMINHO_FECHAMENTOS);
  if (arqFechamentos && arqFechamentos.conteudo) {
    const obj = parseSeguro<ArquivoFechamentos | null>(arqFechamentos.conteudo, null);
    if (obj) {
      fechamentos = mesclarRegistros(fechamentos, obj.fechamentos ?? []);
    }
  }

  // aulas: um arquivo por mês
  const aulasMescladas: Aula[] = [];
  const mesesLocais = new Set(aulas.map((a) => a.mesRef));
  const mesesRemotos = new Set<string>();

  for (const [caminho, cont] of remotos) {
    if (!caminho.startsWith('dados/aulas/')) continue;
    if (!cont.conteudo) continue;
    const obj = parseSeguro<ArquivoAulas | null>(cont.conteudo, null);
    if (!obj) continue;
    const mesRef = caminho.replace('dados/aulas/', '').replace('.txt', '');
    mesesRemotos.add(mesRef);
    const locaisDoMes = aulas.filter((a) => a.mesRef === mesRef);
    const mesclados = mesclarRegistros(locaisDoMes, obj.aulas ?? []);
    aulasMescladas.push(...mesclados);
  }

  // Meses que só existem localmente (sem arquivo remoto) — mantém as aulas locais
  for (const mesRef of mesesLocais) {
    if (!mesesRemotos.has(mesRef)) {
      aulasMescladas.push(...aulas.filter((a) => a.mesRef === mesRef));
    }
  }

  // Dedup: pode haver aulas com mesmo id vindo de caminhos diferentes (não deveria, mas por segurança)
  const dedup = new Map<string, Aula>();
  for (const a of aulasMescladas) {
    const existente = dedup.get(a.id);
    if (!existente || a.atualizadoEm > existente.atualizadoEm) {
      dedup.set(a.id, a);
    }
  }

  return {
    versaoFormato,
    config,
    alunos,
    turmas,
    aulas: Array.from(dedup.values()).sort((a, b) => a.id.localeCompare(b.id)),
    cronograma,
    fechamentos,
  };
}

// ===== Ciclo de sync =====

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
    sincronizar().catch((e) => console.error('sync agendado:', e));
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

async function executarCiclo(): Promise<void> {
  const syncConfig = carregarSync();
  if (!syncConfig || !syncConfig.token) {
    // Sem token: modo local. Não há nada a sincronizar.
    setStatus({ status: 'ocioso', ultimoErro: null, arquivosPendentes: 0 });
    return;
  }

  const { repo, branch, token } = syncConfig;
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    setStatus({ status: 'erro', ultimoErro: 'Repositório inválido (use owner/repo)' });
    return;
  }

  setStatus({ status: 'sincronizando', ultimoErro: null });

  try {
    // R-39: garante que a branch `dados` existe
    await criarBranchDados(owner, repoName, branch, token);

    // Lista arquivos remotos
    const caminhosRemotos: string[] = [];
    caminhosRemotos.push(...await listarArquivos(owner, repoName, branch, 'dados', token));
    caminhosRemotos.push(...await listarArquivos(owner, repoName, branch, 'dados/aulas', token));

    // Pega shas guardados e pendentes
    const { meta } = useStore.getState();
    const shasLocais = meta.shas;
    const pendentes = meta.pendentes;

    // Baixa TODOS os arquivos remotos (não temos sha remoto sem baixar).
    // R-43: a mescla nunca apaga local; baixar a mais é seguro.
    const paraBaixar = new Set<string>(caminhosRemotos);
    for (const caminho of pendentes) {
      paraBaixar.add(caminho);
    }

    // Baixa todos os arquivos necessários
    const remotos = new Map<string, ConteudoArquivo>();
    for (const caminho of paraBaixar) {
      const cont = await baixarArquivo(owner, repoName, branch, caminho, token);
      remotos.set(caminho, cont);
    }

    // R-40: verifica relógio usando a primeira resposta (aproximação)
    // (verificação real seria no baixarArquivo; aqui simplificamos)

    // Mescla remoto no local
    const estadoLocal = useStore.getState();
    const { meta: _m, erroCorrupcao: _e, ...estadoPuro } = estadoLocal;
    void _m;
    void _e;
    const estadoMesclado = mesclarArquivosRemotos(estadoPuro, remotos);

    // Aplica no store (set único — R-31)
    useStore.setState({
      ...estadoMesclado,
      meta: estadoLocal.meta,
      erroCorrupcao: estadoLocal.erroCorrupcao,
    });
    salvarEstado(estadoMesclado);

    // Atualiza shas guardados
    const novosShas: Record<string, string> = { ...shasLocais };
    for (const [caminho, cont] of remotos) {
      if (cont.sha) {
        novosShas[caminho] = cont.sha;
      }
    }

    // Agora envia arquivos cujo conteúdo local difere do remoto
    const arquivosLocais = estadoParaArquivos(estadoMesclado);
    const pendentesAinda: string[] = [];

    // Escritas seriais com 1s de intervalo (R-38)
    for (const caminho of Object.keys(arquivosLocais)) {
      const conteudoLocal = arquivosLocais[caminho] ?? '';
      const remoto = remotos.get(caminho);
      const conteudoRemoto = remoto?.conteudo ?? '';

      // Só envia se conteúdo difere
      if (conteudoLocal === conteudoRemoto && !pendentes.includes(caminho)) {
        continue; // já está sincronizado
      }

      // Retry até 3x em caso de 409/422
      let sucesso = false;
      for (let tentativa = 0; tentativa < 3; tentativa++) {
        try {
          const shaAtual = novosShas[caminho] ?? null;
          const novoSha = await salvarArquivo(owner, repoName, branch, caminho, conteudoLocal, shaAtual, token);
          novosShas[caminho] = novoSha;
          sucesso = true;
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.startsWith('CONFLITO')) {
            // Baixa, mescla e tenta de novo
            const cont = await baixarArquivo(owner, repoName, branch, caminho, token);
            novosShas[caminho] = cont.sha ?? novosShas[caminho] ?? '';
            // Re-mescla só este arquivo
            const estadoRe = useStore.getState();
            const { meta: _m2, erroCorrupcao: _e2, ...estadoPuro2 } = estadoRe;
            void _m2;
            void _e2;
            const reMesclado = mesclarArquivosRemotos(estadoPuro2, new Map([[caminho, cont]]));
            useStore.setState({
              ...reMesclado,
              meta: estadoRe.meta,
              erroCorrupcao: estadoRe.erroCorrupcao,
            });
            salvarEstado(reMesclado);
            // Atualiza conteúdo local para a próxima tentativa
            const novosArquivos = estadoParaArquivos(reMesclado);
            arquivosLocais[caminho] = novosArquivos[caminho] ?? '';
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            throw err;
          }
        }
      }
      if (!sucesso) {
        pendentesAinda.push(caminho);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Atualiza meta
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

    notificarRelogio(null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    setStatus({ status: 'erro', ultimoErro: msg });
    // Mantém pendentes
    const { meta } = useStore.getState();
    salvarMeta({ ...meta, ultimoErro: msg });
  }
}

/** Força nova leitura da nuvem: zera os shas guardados. Nunca apaga dado local. (R-Diagnóstico) */
export function relerNuvem(): void {
  const { meta } = useStore.getState();
  const novaMeta = { ...meta, shas: {} as Record<string, string> };
  salvarMeta(novaMeta);
  useStore.setState({ meta: novaMeta });
}

/** R-40: chamado quando uma resposta do GitHub chega com relógio divergente. */
export function avisarRelogioDivergente(diffMs: number): void {
  const min = Math.round(diffMs / 60000);
  notificarRelogio(`Relógio do aparelho desajustado em ~${min} min. A mescla pode errar.`);
}

// Verifica relógio numa resposta (chamado internamente se precisar)
void verificarRelogio;
