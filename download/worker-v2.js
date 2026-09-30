/**
 * Cloudflare Worker: Controle de Aulas Sync Proxy
 * VERSÃO 2 - com GET /backup (resolve rate limit da GitHub API)
 */

const GITHUB_API = 'https://api.github.com';
const BACKUP_PATH = 'data/backup.txt';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const authHeader = request.headers.get('Authorization');
    const apiSecret = authHeader?.replace('Bearer ', '');
    if (apiSecret !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Nao autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const url = new URL(request.url);

    try {
      // GET /backup — ler do GitHub (USA TOKEN, sem rate limit)
      if (url.pathname === '/backup' && request.method === 'GET') {
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

      // POST /sync — escrever no GitHub
      if (url.pathname === '/sync' && request.method === 'POST') {
        const body = await request.json();
        if (!body.content) {
          return new Response(JSON.stringify({ error: 'content obrigatorio' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Pega o SHA atual
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

        // Codifica e envia
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

      // Health check
      if (url.pathname === '/' || url.pathname === '/health') {
        return new Response(JSON.stringify({
          ok: true,
          service: 'controle-aulas-sync',
          version: '2',
          hasToken: !!env.GITHUB_TOKEN,
          hasApiSecret: !!env.API_SECRET,
          repo: env.GITHUB_REPO,
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: 'Rota nao encontrada' }), {
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
