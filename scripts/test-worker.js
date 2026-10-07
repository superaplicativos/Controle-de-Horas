// Testa o Worker com diferentes scenarios
const WORKER_URL = 'https://controle-aulas-sync.controler-2a4.workers.dev';
const API_SECRET = 'controle-aulas-2026-emerald';

async function testar(titulo, fn) {
  console.log(`\n=== ${titulo} ===`);
  try {
    const r = await fn();
    console.log('OK:', r);
  } catch (e) {
    console.log('ERRO:', e.message);
  }
}

async function healthCheck() {
  const r = await fetch(`${WORKER_URL}/health`);
  return { status: r.status, body: await r.text() };
}

async function syncComAuth() {
  const r = await fetch(`${WORKER_URL}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: 'test content from QA\n' + new Date().toISOString(), branch: 'main' }),
  });
  const body = await r.text();
  return { status: r.status, body };
}

(async () => {
  await testar('Health check', healthCheck);
  await testar('Sync válido', syncComAuth);
})();
