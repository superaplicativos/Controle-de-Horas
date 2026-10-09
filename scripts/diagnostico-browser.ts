import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage();

const erros: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') erros.push('CONSOLE: ' + msg.text());
});
page.on('pageerror', (err) => erros.push('PAGEERROR: ' + err.message));

await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(2000);

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML.slice(0, 300) ?? 'VAZIO');

console.log('=== ERROS ===');
if (erros.length === 0) console.log('(nenhum)');
for (const e of erros) console.log(e);
console.log('\n=== BODY TEXT ===');
console.log(bodyText || '(vazio)');
console.log('\n=== ROOT HTML (primeiros 300 chars) ===');
console.log(rootHtml);

await browser.close();
