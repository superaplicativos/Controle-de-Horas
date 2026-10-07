/**
 * Cloudflare Worker: Controle de Aulas Sync Proxy
 * VERSÃO 4 — adaptado para a estrutura real do backup.txt
 *
 * Mantém um arquivo separado data/professores.json com a lista de
 * professores e seus status de assinatura. Isso é separado do backup
 * principal (data/backup.txt) que contém aulas, alunos, etc.
 */

const GITHUB_API = 'https://api.github.com';
const BACKUP_PATH = 'data/backup.txt';
const PROFESSORES_PATH = 'data/professores.json';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ===== Cache em memória =====
let professoresCache = null;
let cacheTime = 0;

async function carregarProfessores(env) {
  if (professoresCache && Date.now() - cacheTime < 30000) {
    return professoresCache;
  }
  try {
    const resp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${PROFESSORES_PATH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'controle-aulas-worker',
      },
    });
    if (!resp.ok) {
      // Arquivo não existe ainda — retorna lista vazia
      return [];
    }
    const data = await resp.json();
    const conteudo = atob(data.content.replace(/\n/g, ''));
    const professores = JSON.parse(conteudo);
    professoresCache = professores;
    cacheTime = Date.now();
    return professores;
  } catch (e) {
    return [];
  }
}

async function salvarProfessores(professores, env) {
  // Pega o SHA atual
  let sha;
  try {
    const resp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${PROFESSORES_PATH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'controle-aulas-worker',
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      sha = data.sha;
    }
  } catch (e) {}

  const conteudo = JSON.stringify(professores, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(conteudo)));

  const putResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${PROFESSORES_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'controle-aulas-worker',
    },
    body: JSON.stringify({
      message: `Atualização professores - ${new Date().toISOString()}`,
      content: encoded,
      branch: 'main',
      ...(sha ? { sha } : {}),
    }),
  });

  // Limpa cache
  professoresCache = null;
  return putResp.ok;
}

async function registrarProfessor(username, env) {
  const professores = await carregarProfessores(env);
  let prof = professores.find((p) => p.username === username);

  if (!prof) {
    // Novo professor — adiciona com trial de 7 dias
    prof = {
      username,
      assinatura_status: 'free_trial',
      trial_fim: Date.now() + 7 * 24 * 60 * 60 * 1000,
      bloqueado: false,
      criado_em: Date.now(),
    };
    professores.push(prof);
    await salvarProfessores(professores, env);
  }

  return prof;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ===== WEBHOOK MERCADO PAGO =====
    if (path === '/webhook/mercado-pago' && request.method === 'POST') {
      try {
        const body = await request.json();

        if (body.topic === 'preapproval' || body.action === 'created' || body.action === 'updated') {
          const preapprovalId = body.resource || body.data?.id;
          if (preapprovalId && env.MP_ACCESS_TOKEN) {
            // Consulta detalhes da assinatura no MP
            try {
              const mpResp = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: {
                  Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
                },
              });
              if (mpResp.ok) {
                const mpData = await mpResp.json();
                const username = mpData.external_reference;
                if (username) {
                  const professores = await carregarProfessores(env);
                  let prof = professores.find((p) => p.username === username);
                  if (!prof) {
                    prof = { username, assinatura_status: 'free_trial', bloqueado: false };
                    professores.push(prof);
                  }

                  // Mapeia status do MP para o app
                  const mpStatus = mpData.status;
                  if (mpStatus === 'authorized' || mpStatus === 'active') {
                    prof.assinatura_status = 'active';
                    prof.bloqueado = false;
                  } else if (mpStatus === 'pending') {
                    prof.assinatura_status = 'free_trial';
                  } else if (mpStatus === 'cancelled' || mpStatus === 'ended' || mpStatus === 'expired') {
                    prof.assinatura_status = 'cancelled';
                    prof.bloqueado = true;
                  } else if (mpStatus === 'paused') {
                    prof.assinatura_status = 'cancelled';
                  }

                  prof.assinatura_id = preapprovalId;
                  await salvarProfessores(professores, env);

                  return new Response(JSON.stringify({ ok: true, updated: true, username }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                  });
                }
              }
            } catch (e) {
              console.log('Erro ao consultar MP:', e.message);
            }

            return new Response(JSON.stringify({ ok: true, received: true, id: preapprovalId }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        }

        return new Response(JSON.stringify({ ok: true, ignored: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ===== AUTENTICAÇÃO =====
    const authHeader = request.headers.get('Authorization');
    const apiSecret = authHeader?.replace('Bearer ', '');
    if (apiSecret !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      // ===== GET /backup =====
      if (path === '/backup' && request.method === 'GET') {
        const ghResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'controle-aulas-worker',
          },
        });
        if (ghResp.status === 404) {
          return new Response(JSON.stringify({ exists: false }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        if (!ghResp.ok) {
          const errText = await ghResp.text();
          return new Response(JSON.stringify({ error: 'GitHub API: ' + errText, status: ghResp.status }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const data = await ghResp.json();
        const conteudo = atob(data.content.replace(/\n/g, ''));
        return new Response(JSON.stringify({ exists: true, content: conteudo, sha: data.sha }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== POST /sync =====
      if (path === '/sync' && request.method === 'POST') {
        const body = await request.json();
        if (!body.content) {
          return new Response(JSON.stringify({ error: 'content obrigatório' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        let sha;
        try {
          const getResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
            headers: {
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
              'User-Agent': 'controle-aulas-worker',
            },
          });
          if (getResp.ok) {
            const data = await getResp.json();
            sha = data.sha;
          }
        } catch (e) {}

        const encoded = btoa(unescape(encodeURIComponent(body.content)));

        const putResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'controle-aulas-worker',
          },
          body: JSON.stringify({
            message: `Sync Controle de Aulas - ${new Date().toISOString()}`,
            content: encoded,
            branch: body.branch || 'main',
            ...(sha ? { sha } : {}),
          }),
        });

        if (!putResp.ok) {
          const errText = await putResp.text();
          return new Response(JSON.stringify({
            error: 'Erro ao escrever no GitHub',
            status: putResp.status,
            details: errText.substring(0, 300),
          }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const result = await putResp.json();
        return new Response(JSON.stringify({ success: true, sha: result.content.sha }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== GET /assinatura/:username =====
      const assinaturaMatch = path.match(/^\/assinatura\/(.+)$/);
      if (assinaturaMatch && request.method === 'GET') {
        const username = assinaturaMatch[1];

        // Guilherme (dono) — sempre lifetime
        if (username === 'guilherme') {
          return new Response(JSON.stringify({
            username,
            assinatura_status: 'lifetime',
            bloqueado: false,
            is_admin: true,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Outros professores — registra se não existir, retorna status
        const prof = await registrarProfessor(username, env);
        return new Response(JSON.stringify(prof), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== GET /admin/professores =====
      if (path === '/admin/professores' && request.method === 'GET') {
        const professores = await carregarProfessores(env);
        // Sempre inclui Guilherme no topo
        const todos = [
          {
            username: 'guilherme',
            nome: 'Guilherme Miranda',
            assinatura_status: 'lifetime',
            bloqueado: false,
            is_admin: true,
          },
          ...professores.filter((p) => p.username !== 'guilherme'),
        ];
        return new Response(JSON.stringify({ professores: todos }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== POST /admin/professor/:username =====
      const adminMatch = path.match(/^\/admin\/professor\/(.+)$/);
      if (adminMatch && request.method === 'POST') {
        const username = adminMatch[1];
        const body = await request.json();
        const professores = await carregarProfessores(env);

        let prof = professores.find((p) => p.username === username);
        if (!prof) {
          prof = {
            username,
            assinatura_status: 'free_trial',
            bloqueado: false,
            criado_em: Date.now(),
          };
          professores.push(prof);
        }

        if (body.assinatura_status !== undefined) {
          prof.assinatura_status = body.assinatura_status;
        }
        if (body.bloqueado !== undefined) {
          prof.bloqueado = body.bloqueado;
        }
        prof.atualizado_em = Date.now();

        await salvarProfessores(professores, env);
        return new Response(JSON.stringify({ success: true, professor: prof }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== Health check =====
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({
          ok: true,
          service: 'controle-aulas-sync',
          version: '4',
          hasToken: !!env.GITHUB_TOKEN,
          hasApiSecret: !!env.API_SECRET,
          hasMPToken: !!env.MP_ACCESS_TOKEN,
          repo: env.GITHUB_REPO,
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: 'Rota não encontrada', path }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
