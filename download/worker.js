/**
 * Cloudflare Worker: Controle de Aulas Sync Proxy
 * 
 * Recebe requests do frontend, valida API_SECRET, e faz operações no GitHub.
 * O token GitHub NUNCA é exposto pro navegador — só fica aqui no Worker.
 */

const GITHUB_API = 'https://api.github.com';
const BACKUP_PATH = 'data/backup.txt';

export default {
  async fetch(request, env) {
    // CORS headers (libera o app Controle de Aulas)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Secret',
    };

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Validar API_SECRET (senha compartilhada com o app)
    const apiSecret = request.headers.get('X-API-Secret');
    if (apiSecret !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const url = new URL(request.url);

    try {
      // GET /backup — ler do GitHub
      if (url.pathname === '/backup' && request.method === 'GET') {
        const ghResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
          },
        });

        if (ghResp.status === 404) {
          return new Response(JSON.stringify({ exists: false }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (!ghResp.ok) {
          const err = await ghResp.json().catch(() => ({}));
          return new Response(JSON.stringify({ error: err.message || 'Erro no GitHub' }), {
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

      // POST /backup — escrever no GitHub
      if (url.pathname === '/backup' && request.method === 'POST') {
        const body = await request.json();
        if (!body.content) {
          return new Response(JSON.stringify({ error: 'content é obrigatório' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Pega o SHA atual (se arquivo já existe)
        let sha;
        try {
          const getResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
            headers: {
              Authorization: `Bearer ${env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github+json',
            },
          });
          if (getResp.ok) {
            const data = await getResp.json();
            sha = data.sha;
          }
        } catch (e) {
          // arquivo ainda não existe, tudo bem
        }

        const putResp = await fetch(`${GITHUB_API}/repos/${env.GITHUB_REPO}/contents/${BACKUP_PATH}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Sync Controle de Aulas - ${new Date().toISOString()}`,
            content: btoa(unescape(encodeURIComponent(body.content))),
            branch: body.branch || 'main',
            ...(sha ? { sha } : {}),
          }),
        });

        if (!putResp.ok) {
          const err = await putResp.json().catch(() => ({}));
          return new Response(JSON.stringify({ error: err.message || 'Erro ao escrever no GitHub' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const result = await putResp.json();
        return new Response(JSON.stringify({ success: true, sha: result.content.sha }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Health check
      if (url.pathname === '/' || url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true, service: 'controle-aulas-sync' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: 'Rota não encontrada' }), {
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
