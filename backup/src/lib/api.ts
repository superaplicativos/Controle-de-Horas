/**
 * API layer — fala com o Cloudflare Worker (que usa D1).
 *
 * Substitui o antigo github.ts (que usava arquivo .txt no GitHub).
 * Agora os dados vão pra um banco de dados SQL de verdade (D1).
 */

import type { Professor, Aula, Aluno, Turma, Fechamento, CronogramaItem } from '@/types';
import { salvarAula, salvarAluno, salvarTurma, salvarFechamento, salvarCronogramaItem, listarAulasPorProfessor, listarAlunosPorProfessor, listarTurmasPorProfessor, listarFechamentosPorProfessor, listarCronogramaPorProfessor, salvarProfessor, limparDadosProfessor } from './db';

export const WORKER_URL = 'https://controle-aulas-sync.control-de-horas.workers.dev';
export const API_SECRET = 'controle-aulas-2026-emerald';

function authHeaders() {
  return {
    'Authorization': `Bearer ${API_SECRET}`,
    'Content-Type': 'application/json',
  };
}

// ===== AUTH =====

export async function cadastrarProfessorAPI(dados: {
  username: string;
  senha: string;
  nome: string;
  valor_hora: number;
}): Promise<{ ok: boolean; erro?: string; professor?: any }> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/auth/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const data = await resp.json();
    return data;
  } catch (e: any) {
    return { ok: false, erro: e.message };
  }
}

export async function loginProfessorAPI(username: string, senha: string): Promise<{ ok: boolean; erro?: string; professor?: any }> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, senha }),
    });
    const data = await resp.json();
    return data;
  } catch (e: any) {
    return { ok: false, erro: e.message };
  }
}

// ===== SYNC =====

/**
 * Puxa TODOS os dados do professor do D1 e SALVA no IndexedDB.
 *
 * FULL REPLACE: limpa o cache local antes de importar, para que o navegador
 * seja um espelho exato da nuvem (sem lixo de versões antigas).
 *
 * Segurança: só limpa o local se a nuvem responder OK e com dados.
 * Se a nuvem vier vazia ou com erro, NÃO toca no local (pra não apagar tudo).
 */
export async function puxarDoCloud(professor: Professor): Promise<{ ok: boolean; erro?: string; alteracoes: number }> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/dados/${professor.username}`, {
      headers: authHeaders(),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, erro: err.erro || `HTTP ${resp.status}`, alteracoes: 0 };
    }

    const data = await resp.json();
    if (!data.ok) {
      return { ok: false, erro: data.erro, alteracoes: 0 };
    }

    // Conta quantos itens vieram da nuvem. Se vier zero de tudo, NÃO limpa local.
    const totalNuvem =
      (data.alunos?.length || 0) +
      (data.turmas?.length || 0) +
      (data.aulas?.length || 0) +
      (data.cronograma?.length || 0) +
      (data.fechamentos?.length || 0);

    if (totalNuvem === 0) {
      // Nuvem vazia: não faz nada. Não é papel do pull apagar o local.
      return { ok: true, alteracoes: 0 };
    }

    // FULL REPLACE: limpa tudo do professor no cache local antes de importar.
    await limparDadosProfessor(professor.id);

    let alteracoes = 0;

    // Salva professor (atualiza cache local com dados do D1)
    const profData = data.professor;
    if (profData) {
      const profAtualizado: Professor = {
        ...professor,
        assinatura_status: profData.assinatura_status || professor.assinatura_status,
        assinatura_id: profData.assinatura_id || professor.assinatura_id,
        trial_fim: profData.trial_fim || professor.trial_fim,
        bloqueado: !!profData.bloqueado,
        is_admin: !!profData.is_admin,
      };
      await salvarProfessor(profAtualizado);
    }

    // Salva alunos (converte int → boolean)
    if (data.alunos) {
      for (const a of data.alunos) {
        await salvarAluno({
          ...a,
          ativo: !!a.ativo,
        } as Aluno);
        alteracoes++;
      }
    }

    // Salva turmas
    if (data.turmas) {
      for (const t of data.turmas) {
        await salvarTurma(t as Turma);
        alteracoes++;
      }
    }

    // Salva aulas
    if (data.aulas) {
      for (const a of data.aulas) {
        await salvarAula(a as Aula);
        alteracoes++;
      }
    }

    // Salva cronograma
    if (data.cronograma) {
      for (const c of data.cronograma) {
        await salvarCronogramaItem(c as CronogramaItem);
        alteracoes++;
      }
    }

    // Salva fechamentos
    if (data.fechamentos) {
      for (const f of data.fechamentos) {
        await salvarFechamento(f as Fechamento);
        alteracoes++;
      }
    }

    return { ok: true, alteracoes };
  } catch (e: any) {
    return { ok: false, erro: e.message, alteracoes: 0 };
  }
}

/**
 * Envia TODOS os dados locais (IndexedDB) pro D1 via Worker.
 * Faz um "full replace" — o D1 substitui todos os dados do professor.
 */
export async function enviarParaCloud(professor: Professor): Promise<{ ok: boolean; erro?: string }> {
  try {
    // Pega todos os dados locais
    const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
      listarAulasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
      listarTurmasPorProfessor(professor.id),
      listarFechamentosPorProfessor(professor.id),
      listarCronogramaPorProfessor(professor.id),
    ]);

    const resp = await fetch(`${WORKER_URL}/api/dados/${professor.username}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        alunos: alunos.map(a => ({ ...a, ativo: a.ativo ? 1 : 0 })), // boolean → int pro D1
        turmas,
        aulas,
        cronograma,
        fechamentos,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, erro: err.erro || `HTTP ${resp.status}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, erro: e.message };
  }
}

// ===== ADMIN =====

export async function listarProfessoresAPI(): Promise<any[]> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/admin/professores`, {
      headers: authHeaders(),
    });
    const data = await resp.json();
    return data.professores || [];
  } catch (e) {
    return [];
  }
}

export async function atualizarProfessorAPI(username: string, dados: { assinatura_status?: string; bloqueado?: boolean }): Promise<boolean> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/admin/professor/${username}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dados),
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

export async function verificarAssinaturaAPI(username: string): Promise<any | null> {
  try {
    const resp = await fetch(`${WORKER_URL}/api/assinatura/${username}`, {
      headers: authHeaders(),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}
