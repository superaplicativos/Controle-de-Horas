/**
 * Cloudflare Worker: Controle de Aulas — VERSÃO D1
 *
 * Banco de dados: Cloudflare D1 (SQLite na edge)
 * Binding: env.DB
 *
 * Diferença da versão anterior:
 * - Antes: dados em arquivo .txt no GitHub (frágil, perde dados)
 * - Agora: dados em banco de dados SQL no D1 (robusto, concorrente, seguro)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ===== CRYPTO HELPERS (Web Crypto API disponível no Worker) =====

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(senha, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}::${senha}::controle-aulas-v1`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ===== HEALTH CHECK =====
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({
          ok: true,
          service: 'controle-aulas-sync',
          version: 'd1',
          hasDB: !!env.DB,
          hasApiSecret: !!env.API_SECRET,
          hasMPToken: !!env.MP_ACCESS_TOKEN,
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== WEBHOOK MERCADO PAGO (público, validado pelo MP) =====
      if (path === '/webhook/mercado-pago' && request.method === 'POST') {
        const body = await request.json();
        if (body.topic === 'preapproval' || body.action === 'created' || body.action === 'updated') {
          const preapprovalId = body.resource || body.data?.id;
          if (preapprovalId && env.MP_ACCESS_TOKEN) {
            try {
              const mpResp = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
                headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
              });
              if (mpResp.ok) {
                const mpData = await mpResp.json();
                const username = mpData.external_reference;
                if (username && env.DB) {
                  let status = 'free_trial';
                  let bloqueado = 0;
                  const mpStatus = mpData.status;
                  if (mpStatus === 'authorized' || mpStatus === 'active') {
                    status = 'active'; bloqueado = 0;
                  } else if (mpStatus === 'cancelled' || mpStatus === 'ended' || mpStatus === 'expired') {
                    status = 'cancelled'; bloqueado = 1;
                  } else if (mpStatus === 'paused') {
                    status = 'cancelled';
                  }
                  await env.DB.prepare(
                    'UPDATE professores SET assinatura_status = ?, assinatura_id = ?, bloqueado = ? WHERE username = ?'
                  ).bind(status, preapprovalId, bloqueado, username).run();
                  return new Response(JSON.stringify({ ok: true, updated: true, username }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                  });
                }
              }
            } catch (e) {}
            return new Response(JSON.stringify({ ok: true, received: true }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        }
        return new Response(JSON.stringify({ ok: true, ignored: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== AUTENTICAÇÃO (público, sem API_SECRET) =====

      // POST /api/auth/cadastro
      if (path === '/api/auth/cadastro' && request.method === 'POST') {
        const body = await request.json();
        const username = (body.username || '').trim().toLowerCase();
        if (username.length < 3) return json({ ok: false, erro: 'Usuário deve ter no mínimo 3 caracteres' }, 400);
        if (!body.senha || body.senha.length < 4) return json({ ok: false, erro: 'Senha deve ter no mínimo 4 caracteres' }, 400);

        // Verifica se já existe
        const existing = await env.DB.prepare('SELECT id FROM professores WHERE username = ?').bind(username).first();
        if (existing) return json({ ok: false, erro: 'Usuário já existe' }, 409);

        const salt = generateSalt();
        const hash = await hashPassword(body.senha, salt);
        const id = generateId();
        const trialFim = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const isAdmin = username === 'guilherme' ? 1 : 0;
        const status = isAdmin ? 'lifetime' : 'free_trial';

        await env.DB.prepare(
          'INSERT INTO professores (id, username, senha_hash, salt, nome, valor_hora, valor_falta, assinatura_status, trial_fim, bloqueado, is_admin, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, username, hash, salt, body.nome || username, body.valor_hora || 35, 35, status, trialFim, 0, isAdmin, Date.now()).run();

        // Busca o professor completo pra retornar
        const prof = await env.DB.prepare('SELECT * FROM professores WHERE username = ?').bind(username).first();
        return json({ ok: true, professor: prof });
      }

      // POST /api/auth/login
      if (path === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json();
        const username = (body.username || '').trim().toLowerCase();
        const prof = await env.DB.prepare('SELECT * FROM professores WHERE username = ?').bind(username).first();
        if (!prof) return json({ ok: false, erro: 'Usuário não encontrado' }, 404);

        // Verifica senha (Worker faz o hash e compara)
        const inputHash = await hashPassword(body.senha, prof.salt);
        if (inputHash !== prof.senha_hash) return json({ ok: false, erro: 'Senha incorreta' }, 401);

        // Verifica se está bloqueado
        if (prof.bloqueado) return json({ ok: false, erro: 'Conta bloqueada pelo administrador' }, 403);

        return json({ ok: true, professor: prof });
      }

      // ===== ENDPOINTS AUTENTICADOS (precisa API_SECRET) =====
      const authHeader = request.headers.get('Authorization');
      const apiSecret = authHeader?.replace('Bearer ', '');
      if (apiSecret !== env.API_SECRET) {
        return json({ error: 'Não autorizado' }, 401);
      }

      // GET /api/dados/:username — retorna TODOS os dados do professor
      const dadosMatch = path.match(/^\/api\/dados\/(.+)$/);
      if (dadosMatch && request.method === 'GET') {
        const username = dadosMatch[1];
        const prof = await env.DB.prepare('SELECT * FROM professores WHERE username = ?').bind(username).first();
        if (!prof) return json({ ok: false, erro: 'Professor não encontrado' }, 404);

        const [alunos, turmas, aulas, cronograma, fechamentos] = await Promise.all([
          env.DB.prepare('SELECT * FROM alunos WHERE professor_id = ?').bind(prof.id).all(),
          env.DB.prepare('SELECT * FROM turmas WHERE professor_id = ?').bind(prof.id).all(),
          env.DB.prepare('SELECT * FROM aulas WHERE professor_id = ?').bind(prof.id).all(),
          env.DB.prepare('SELECT * FROM cronograma WHERE professor_id = ?').bind(prof.id).all(),
          env.DB.prepare('SELECT * FROM fechamentos WHERE professor_id = ?').bind(prof.id).all(),
        ]);

        return json({
          ok: true,
          professor: prof,
          alunos: alunos.results || [],
          turmas: turmas.results || [],
          aulas: aulas.results || [],
          cronograma: cronograma.results || [],
          fechamentos: fechamentos.results || [],
        });
      }

      // POST /api/dados/:username — SALVA todos os dados (full replace)
      if (dadosMatch && request.method === 'POST') {
        const username = dadosMatch[1];
        const prof = await env.DB.prepare('SELECT * FROM professores WHERE username = ?').bind(username).first();
        if (!prof) return json({ ok: false, erro: 'Professor não encontrado' }, 404);

        const body = await request.json();
        const pid = prof.id;

        // Apaga tudo existente
        await env.DB.batch([
          env.DB.prepare('DELETE FROM aulas WHERE professor_id = ?').bind(pid),
          env.DB.prepare('DELETE FROM alunos WHERE professor_id = ?').bind(pid),
          env.DB.prepare('DELETE FROM turmas WHERE professor_id = ?').bind(pid),
          env.DB.prepare('DELETE FROM cronograma WHERE professor_id = ?').bind(pid),
          env.DB.prepare('DELETE FROM fechamentos WHERE professor_id = ?').bind(pid),
        ]);

        // Insere alunos
        if (body.alunos) {
          for (const a of body.alunos) {
            await env.DB.prepare(
              'INSERT INTO alunos (id, professor_id, nome, tipo, turma_id, ativo, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(a.id, pid, a.nome, a.tipo, a.turma_id, a.ativo ? 1 : 0, a.criado_em).run();
          }
        }

        // Insere turmas
        if (body.turmas) {
          for (const t of body.turmas) {
            await env.DB.prepare(
              'INSERT INTO turmas (id, professor_id, nome, criado_em) VALUES (?, ?, ?, ?)'
            ).bind(t.id, pid, t.nome, t.criado_em).run();
          }
        }

        // Insere aulas
        if (body.aulas) {
          for (const a of body.aulas) {
            await env.DB.prepare(
              'INSERT INTO aulas (id, professor_id, aluno_id, aluno_nome, aluno_tipo, data, horario, duracao, status, conteudo, valor, mes_ref, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(a.id, pid, a.aluno_id, a.aluno_nome, a.aluno_tipo, a.data, a.horario, a.duracao, a.status, a.conteudo, a.valor, a.mes_ref, a.criado_em).run();
          }
        }

        // Insere cronograma
        if (body.cronograma) {
          for (const c of body.cronograma) {
            await env.DB.prepare(
              'INSERT INTO cronograma (id, professor_id, titulo, aluno_nome, data, horario, duracao, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(c.id, pid, c.titulo, c.aluno_nome, c.data, c.horario, c.duracao, c.observacao, c.criado_em).run();
          }
        }

        // Insere fechamentos
        if (body.fechamentos) {
          for (const f of body.fechamentos) {
            await env.DB.prepare(
              'INSERT INTO fechamentos (id, professor_id, mes, total_aulas, total_horas, total_ganhos, total_faltas, total_presencas, snapshot_json, fechado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(f.id, pid, f.mes, f.total_aulas, f.total_horas, f.total_ganhos, f.total_faltas, f.total_presencas, f.snapshot_json, f.fechado_em).run();
          }
        }

        return json({ ok: true, saved: true });
      }

      // GET /api/admin/professores — lista todos (admin)
      if (path === '/api/admin/professores' && request.method === 'GET') {
        const result = await env.DB.prepare('SELECT id, username, nome, assinatura_status, trial_fim, bloqueado, is_admin, criado_em FROM professores ORDER BY criado_em DESC').all();
        return json({ professores: result.results || [] });
      }

      // POST /api/admin/professor/:username — atualiza professor (admin)
      const adminMatch = path.match(/^\/api\/admin\/professor\/(.+)$/);
      if (adminMatch && request.method === 'POST') {
        const username = adminMatch[1];
        const body = await request.json();
        const sets = [];
        const binds = [];
        if (body.assinatura_status !== undefined) { sets.push('assinatura_status = ?'); binds.push(body.assinatura_status); }
        if (body.bloqueado !== undefined) { sets.push('bloqueado = ?'); binds.push(body.bloqueado ? 1 : 0); }
        if (sets.length === 0) return json({ ok: false, erro: 'Nada para atualizar' }, 400);
        binds.push(username);
        await env.DB.prepare(`UPDATE professores SET ${sets.join(', ')} WHERE username = ?`).bind(...binds).run();
        const prof = await env.DB.prepare('SELECT id, username, nome, assinatura_status, trial_fim, bloqueado, is_admin FROM professores WHERE username = ?').bind(username).first();
        return json({ ok: true, professor: prof });
      }

      // GET /api/assinatura/:username — status da assinatura
      const assinaturaMatch = path.match(/^\/api\/assinatura\/(.+)$/);
      if (assinaturaMatch && request.method === 'GET') {
        const username = assinaturaMatch[1];
        const prof = await env.DB.prepare('SELECT username, assinatura_status, assinatura_id, trial_fim, bloqueado, is_admin FROM professores WHERE username = ?').bind(username).first();
        if (!prof) {
          return json({ username, assinatura_status: 'free_trial', trial_fim: Date.now() + 7 * 24 * 60 * 60 * 1000, bloqueado: 0 });
        }
        return json(prof);
      }

      return json({ error: 'Rota não encontrada', path }, 404);
    } catch (e) {
      return json({ error: e.message, stack: e.stack?.substring(0, 200) }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
