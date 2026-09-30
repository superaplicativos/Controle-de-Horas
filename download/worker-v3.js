/**
 * Cloudflare Worker: Controle de Aulas Sync Proxy
 * VERSÃO 3 - com webhook Mercado Pago + rotas admin
 */

const GITHUB_API = 'https://api.github.com';
const BACKUP_PATH = 'data/backup.txt';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Professores em memória (também persistidos no GitHub via backup.txt)
// Em produção, considere usar KV (Cloudflare Workers KV) para persistência real
let professoresCache = null;
let cacheTime = 0;

async function carregarProfessores(env) {
  // Cache de 30 segundos
  if (professoresCache && Date.now() - cacheTime < 30000) {
    return professoresCache;
  }

  try {
    const resp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'controle-aulas-worker',
      },
    });

    if (!resp.ok) {
      return [];
    }

    const data = await resp.json();
    const conteudo = atob(data.content.replace(/\n/g, ''));
    const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
    if (!match) return [];

    const backup = JSON.parse(match[1].trim());
    const professores = backup.assinaturas || [];
    professoresCache = professores;
    cacheTime = Date.now();
    return professores;
  } catch (e) {
    return [];
  }
}

async function salvarProfessores(professores, env) {
  // Lê o backup atual
  let backupAtual = null;
  let sha;
  try {
    const resp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'controle-aulas-worker',
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      sha = data.sha;
      const conteudo = atob(data.content.replace(/\n/g, ''));
      const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
      if (match) {
        backupAtual = JSON.parse(match[1].trim());
      }
    }
  } catch (e) {}

  // Atualiza a lista de assinaturas
  if (backupAtual) {
    backupAtual.assinaturas = professores;
  } else {
    backupAtual = { assinaturas: professores };
  }

  // Reconstrói o arquivo mantendo a estrutura
  // (Simplificado: só reescreve o JSON completo)
  const linhas = [
    '========================================',
    ' CONTROLE DE AULAS - BACKUP',
    ` Exportado em: ${new Date().toISOString()}`,
    ' Versão: 1',
    '========================================',
    '',
    '----- JSON COMPLETO -----',
    JSON.stringify(backupAtual, null, 2),
    '----- FIM -----',
  ];
  const conteudoNovo = linhas.join('\n');
  const encoded = btoa(unescape(encodeURIComponent(conteudoNovo)));

  const putResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'controle-aulas-worker',
    },
    body: JSON.stringify({
      message: `Admin update - ${new Date().toISOString()}`,
      content: encoded,
      branch: 'main',
      ...(sha ? { sha } : {}),
    }),
  });

  // Limpa cache
  professoresCache = null;

  return putResp.ok;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ===== WEBHOOK MERCADO PAGO (sem auth, validado pelo MP) =====
    if (path === '/webhook/mercado-pago' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Mercado Pago envia topic e resource
        // topic: "preapproval" (assinatura) ou "payment"
        // resource: ID do recurso

        if (body.topic === 'preapproval' || body.action === 'created' || body.action === 'updated') {
          const preapprovalId = body.resource || body.data?.id;

          if (preapprovalId) {
            // Consulta a API do Mercado Pago para detalhes
            // (Necessita ACCESS_TOKEN do MP — configurar como variável)
            // Por enquanto, marcamos como ativo e o admin confirma manualmente

            // Em produção: chamar https://api.mercadopago.com/preapproval/{id}
            // com o ACCESS_TOKEN

            return new Response(JSON.stringify({ ok: true, received: true }), {
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

    // ===== AUTENTICAÇÃO NAS OUTRAS ROTAS =====
    const authHeader = request.headers.get('Authorization');
    const apiSecret = authHeader?.replace('Bearer ', '');
    if (apiSecret !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      // ===== GET /backup — ler backup completo =====
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

      // ===== POST /sync — escrever backup =====
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

      // ===== GET /assinatura/:username — status da assinatura =====
      const assinaturaMatch = path.match(/^\/assinatura\/(.+)$/);
      if (assinaturaMatch && request.method === 'GET') {
        const username = assinaturaMatch[1];
        const professores = await carregarProfessores(env);
        const prof = professores.find((p) => p.username === username);

        if (!prof) {
          // Professor não encontrado no cache — retorna free_trial
          return new Response(JSON.stringify({
            username,
            assinatura_status: 'free_trial',
            trial_fim: Date.now() + 7 * 24 * 60 * 60 * 1000,
            bloqueado: false,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        return new Response(JSON.stringify(prof), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== GET /admin/professores — lista todos (admin) =====
      if (path === '/admin/professores' && request.method === 'GET') {
        const professores = await carregarProfessores(env);
        return new Response(JSON.stringify({ professores }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== POST /admin/professor/:username — atualiza professor (admin) =====
      const adminMatch = path.match(/^\/admin\/professor\/(.+)$/);
      if (adminMatch && request.method === 'POST') {
        const username = adminMatch[1];
        const body = await request.json();
        const professores = await carregarProfessores(env);

        let prof = professores.find((p) => p.username === username);
        if (!prof) {
          prof = { username, assinatura_status: 'free_trial', bloqueado: false };
          professores.push(prof);
        }

        if (body.assinatura_status !== undefined) {
          prof.assinatura_status = body.assinatura_status;
        }
        if (body.bloqueado !== undefined) {
          prof.bloqueado = body.bloqueado;
        }

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
          version: '3',
          hasToken: !!env.GITHUB_TOKEN,
          hasApiSecret: !!env.API_SECRET,
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
