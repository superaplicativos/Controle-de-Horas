/**
 * Sistema de assinatura via Mercado Pago.
 *
 * Funcionamento:
 * 1. Professor se cadastra → ganha 7 dias grátis (free_trial)
 * 2. Após 7 dias, se não assinou → bloqueado
 * 3. Para assinar, vai em /assinar → redireciona pro Mercado Pago
 * 4. Mercado Pago chama webhook no Worker → atualiza status para 'active'
 * 5. Worker escreve a atualização no GitHub (data/backup.txt)
 * 6. App faz pull periódico e atualiza o status local
 *
 * Guilherme (dono) tem status 'lifetime' — nunca expira.
 */

import type { Professor } from '@/types';

export const WORKER_URL = 'https://controle-aulas-sync.control-de-horas.workers.dev';
export const API_SECRET = 'controle-aulas-2026-emerald';

/**
 * Verifica se o professor tem acesso liberado.
 */
export function temAcessoLiberado(professor: Professor | null): { liberado: boolean; motivo?: string; diasRestantesTrial?: number } {
  if (!professor) return { liberado: false, motivo: 'Não logado' };

  // Guilherme (dono) — acesso vitalício
  if (professor.is_admin || professor.assinatura_status === 'lifetime') {
    return { liberado: true };
  }

  // Bloqueado manualmente pelo admin
  if (professor.bloqueado) {
    return { liberado: false, motivo: 'Conta bloqueada pelo administrador' };
  }

  // Assinatura ativa
  if (professor.assinatura_status === 'active') {
    return { liberado: true };
  }

  // Trial grátis
  if (professor.assinatura_status === 'free_trial') {
    if (!professor.trial_fim) {
      return { liberado: false, motivo: 'Trial expirado' };
    }
    const agora = Date.now();
    if (agora < professor.trial_fim) {
      const diasRestantes = Math.ceil((professor.trial_fim - agora) / (24 * 60 * 60 * 1000));
      return { liberado: true, diasRestantesTrial: diasRestantes };
    } else {
      return { liberado: false, motivo: 'Período de teste expirado. Assine para continuar.' };
    }
  }

  // Cancelado ou bloqueado
  return { liberado: false, motivo: 'Assinatura inativa. Assine para continuar.' };
}

/**
 * Sincroniza o status da assinatura com o Worker (que consulta o GitHub).
 * Retorna o professor atualizado (ou null se não mudou).
 */
export async function sincronizarAssinatura(professor: Professor): Promise<Professor | null> {
  try {
    const resp = await fetch(`${WORKER_URL}/assinatura/${professor.username}`, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
      },
    });

    if (!resp.ok) {
      console.warn('Falha ao sincronizar assinatura:', resp.status);
      return null;
    }

    const data = await resp.json();
    if (!data || !data.username) return null;

    // Verifica se mudou
    const mudouStatus = data.assinatura_status !== professor.assinatura_status;
    const mudouBloqueio = data.bloqueado !== professor.bloqueado;
    const mudouTrial = data.trial_fim !== professor.trial_fim;

    if (!mudouStatus && !mudouBloqueio && !mudouTrial) {
      return null;
    }

    // Atualiza e salva
    const profAtualizado: Professor = {
      ...professor,
      assinatura_status: data.assinatura_status || professor.assinatura_status,
      assinatura_id: data.assinatura_id || professor.assinatura_id,
      trial_fim: data.trial_fim || professor.trial_fim,
      bloqueado: data.bloqueado ?? professor.bloqueado,
    };

    const { salvarProfessor } = await import('./db');
    await salvarProfessor(profAtualizado);
    return profAtualizado;
  } catch (e) {
    console.warn('Erro ao sincronizar assinatura:', e);
    return null;
  }
}

/**
 * Retorna a URL do Mercado Pago para iniciar a assinatura.
 * Em uma implementação completa, isso seria gerado via API do MP.
 * Por enquanto, usamos o link de pagamento fixo.
 */
export function getMercadoPagoLink(): string {
  return 'https://mpago.la/2jx6dyC';
}
