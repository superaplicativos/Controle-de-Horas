// E2E E-08 a E-12 (seção 24.11)
//
// Testa o fluxo de acesso por senha: contexto novo digita a senha e vê os
// mesmos números do dashboard sem colar token.

import { test, expect, type Page, type Route } from '@playwright/test';

// Mock do GitHub em memória compartilhada entre contextos
function criarMockGitHub() {
  const arquivos = new Map<string, { content: string; sha: string }>();
  const estado = { arquivos, branchExiste: false };
  return estado;
}

async function instalarMock(page: Page, estado: ReturnType<typeof criarMockGitHub>) {
  await page.route('**/api.github.com/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // /repos/{owner}/{repo}
    if (url.match(/\/repos\/[^/]+\/[^/]+$/) && method === 'GET') {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ private: false, default_branch: 'main' }),
      });
      return;
    }

    // /git/refs/heads/main
    if (url.match(/\/git\/refs\/heads\/main$/) && method === 'GET') {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ object: { sha: 'basesha' } }),
      });
      return;
    }

    // /git/refs/heads/dados (verificar acesso.txt existe)
    if (url.match(/\/git\/refs\/heads\/dados/) && method === 'GET') {
      if (!estado.branchExiste) {
        await route.fulfill({ status: 404, body: '{"message":"Not Found"}' });
      } else {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ object: { sha: 'datossite' } }),
        });
      }
      return;
    }

    // criar branch dados
    if (url.endsWith('/git/refs') && method === 'POST') {
      estado.branchExiste = true;
      await route.fulfill({ status: 201, body: '{}' });
      return;
    }

    // listar pasta dados
    if (url.includes('/contents/dados?') && method === 'GET') {
      const itens: { path: string }[] = [];
      for (const caminho of estado.arquivos.keys()) {
        if (caminho.startsWith('dados/') && !caminho.includes('/', 6)) {
          itens.push({ path: caminho });
        }
      }
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(itens),
      });
      return;
    }

    // baixar arquivo (GET /contents/{path})
    if (url.includes('/contents/') && method === 'GET') {
      const match = url.match(/\/contents\/(.+?)(\?|$)/);
      const caminho = match?.[1] ?? '';
      const arq = estado.arquivos.get(caminho);
      if (!arq) {
        await route.fulfill({ status: 404, body: '{"message":"Not Found"}' });
        return;
      }
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: btoa(arq.content), sha: arq.sha }),
      });
      return;
    }

    // salvar arquivo (PUT)
    if (url.includes('/contents/') && method === 'PUT') {
      const match = url.match(/\/contents\/(.+?)(\?|$)/);
      const caminho = match?.[1] ?? '';
      const body = JSON.parse(route.request().postData() || '{}');
      const existente = estado.arquivos.get(caminho);
      if (existente && body.sha && body.sha !== existente.sha) {
        await route.fulfill({ status: 409, body: '{}' });
        return;
      }
      const novoSha = Math.random().toString(36).slice(2, 12);
      estado.arquivos.set(caminho, { content: atob(body.content), sha: novoSha });
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ content: { sha: novoSha } }),
      });
      return;
    }

    await route.fulfill({ status: 404, body: '{}' });
  });

  // raw.githubusercontent.com (leitura anônima do acesso.txt)
  await page.route('**/raw.githubusercontent.com/**', async (route: Route) => {
    const url = route.request().url();
    // Extrai o caminho após o sha
    const match = url.match(/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+?)(\?|$)/);
    const caminho = match?.[1] ?? '';
    const arq = estado.arquivos.get(caminho);
    if (!arq) {
      await route.fulfill({ status: 404, body: '{}' });
      return;
    }
    await route.fulfill({ status: 200, body: arq.content });
  });
}

test.describe('acesso por senha (E-08 a E-12)', () => {
  test('E-08: contexto novo digita a senha e vê os MESMOS números', async ({ browser }) => {
    const estado = criarMockGitHub();

    // Aparelho A: faz a primeira configuração
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await instalarMock(pageA, estado);
    await pageA.goto('/');
    await pageA.evaluate(() => localStorage.clear());

    // Deve aparecer o assistente de primeira configuração
    await expect(pageA.locator('text=Primeira configuração')).toBeVisible({ timeout: 5000 });

    // Passo 1: senha
    await pageA.fill('input[type="password"]', 'SenhaForte123');
    await pageA.fill('input[type="password"]', 'SenhaForte123'); // confirma
    // Pode ter dois campos de senha; preenche ambos
    const senhas = pageA.locator('input[type="password"]');
    await senhas.nth(0).fill('SenhaForte123');
    await senhas.nth(1).fill('SenhaForte123');
    await pageA.click('button:has-text("Avançar")');

    // Passo 2: token
    await pageA.waitForSelector('text=Token do GitHub', { timeout: 5000 });
    await pageA.fill('input[placeholder="github_pat_..."]', 'tok_teste');
    await pageA.click('button:has-text("Validar e avançar")');

    // Passo 3: chave de recuperação
    await pageA.waitForSelector('text=Chave de recuperação', { timeout: 5000 });
    await pageA.check('input[type="checkbox"]');
    await pageA.click('button:has-text("Avançar")');

    // Passo 4: criar
    await pageA.waitForSelector('text=Criar e cifrar', { timeout: 5000 });
    await pageA.click('button:has-text("Criar e cifrar")');

    // Passo 5: entrar
    await pageA.waitForSelector('text=Tudo pronto', { timeout: 10000 });
    await pageA.click('button:has-text("Entrar no sistema")');

    // Aparelho A está no dashboard — cria uma aula
    await pageA.waitForSelector('text=Dashboard', { timeout: 5000 });
    await pageA.goto('/#/alunos');
    await pageA.click('button:has-text("+ Novo")');
    await pageA.fill('input[placeholder="Nome do aluno"]', 'Aluno E2E');
    await pageA.click('button[type="submit"]:has-text("Salvar")');

    await pageA.goto('/#/aulas');
    await pageA.click('button:has-text("+ Nova")');
    await pageA.fill('input[type="date"]', '2026-09-15');
    await pageA.selectOption('select', { label: 'Aluno E2E' });
    await pageA.click('button[type="submit"]:has-text("Salvar")');

    // Sincroniza
    await pageA.goto('/#/configuracoes');
    await pageA.click('button:has-text("Sincronizar agora")');
    await pageA.waitForTimeout(5000);

    // Aparelho B: contexto novo, sem material local
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await instalarMock(pageB, estado);
    await pageB.goto('/');
    await pageB.evaluate(() => localStorage.clear());

    // Deve aparecer a tela de senha (não o assistente, pois acesso.txt já existe)
    await expect(pageB.locator('text=Digite a senha do sistema')).toBeVisible({ timeout: 5000 });

    // Digita a senha
    await pageB.fill('input[type="password"]', 'SenhaForte123');
    await pageB.click('button:has-text("Entrar")');

    // Deve ver o dashboard com os mesmos dados
    await pageB.waitForSelector('text=Dashboard', { timeout: 10000 });
    await pageB.goto('/#/alunos');
    await expect(pageB.locator('text=Aluno E2E')).toBeVisible({ timeout: 5000 });

    await ctxA.close();
    await ctxB.close();
  });

  test('E-11: senha errada é recusada', async ({ browser }) => {
    const estado = criarMockGitHub();
    // Simula que já existe acesso.txt (primeira config já feita)
    estado.branchExiste = true;
    estado.arquivos.set('dados/acesso.txt', {
      content: JSON.stringify({ formato: 1, kdf: { alg: 'PBKDF2-SHA256', iteracoes: 600000, sal: 'AA==' }, iv: 'AA==', ct: 'AA==' }),
      sha: 'sha-acesso',
    });

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await instalarMock(page, estado);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await expect(page.locator('text=Digite a senha do sistema')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="password"]', 'senhaErrada');
    await page.click('button:has-text("Entrar")');

    // Deve mostrar "Senha incorreta"
    await expect(page.locator('text=Senha incorreta')).toBeVisible({ timeout: 5000 });

    await ctx.close();
  });
});
