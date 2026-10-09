// check-rules.mjs — varre src/, e2e/, tests/ e a raiz, reprova padrões proibidos. (R-63)
//
// Sai com código 1 se encontrar qualquer padrão proibido, listando arquivo e linha.
// Faz parte do `npm run verify` (R-59).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '..');

const PADROES_PROIBIDOS = [
  // F-01: opções que ignoram erros de tipo/lint
  { regex: /ignoreBuildErrors|@ts-ignore|@ts-nocheck|eslint-disable/, motivo: 'F-01: opção que ignora erro' },
  // F-09: new Date('AAAA-MM-DD'), Date.parse de string de data
  { regex: /new Date\(['"`]|Date\.parse\(/, motivo: 'F-09: new Date(string) interpreta como UTC; use helpers de domain/datas.ts' },
  // tipagem real: : any e as any
  { regex: /:\s*any\b|as\s+any\b/, motivo: 'tipagem fraca: any' },
  // F-06: catch vazio
  { regex: /\.catch\(\(\)\s*=>\s*\{\s*\}\)|catch\s*\{\s*\}|catch\s*\(\s*\w*\s*\)\s*\{\s*\}/, motivo: 'F-06: catch vazio' },
  // R-55: dangerouslySetInnerHTML
  { regex: /dangerouslySetInnerHTML/, motivo: 'R-55: dangerouslySetInnerHTML proibido' },
  // P-04: toFixed no domínio (dinheiro em float)
  { regex: /toFixed\(/, motivo: 'P-04: toFixed no domínio; dinheiro em centavos inteiros', apenasEm: ['src/domain/'] },
  // D-03: login, senha, professor_id, multi-usuário
  { regex: /professor_id|senha_hash|\blogin\b/, motivo: 'D-03: campo de multi-usuário/login proibido', apenasEm: ['src/'] },
];

const DIRETORIOS_PARA_VARRER = ['src', 'tests', 'e2e'];
const EXTENSOES = ['.ts', '.tsx', '.mjs', '.js', '.html'];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'backup') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (EXTENSOES.some((ext) => entry.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

function checkArquivo(caminho) {
  const conteudo = readFileSync(caminho, 'utf-8');
  const linhas = conteudo.split('\n');
  const problemas = [];
  const relCaminho = relative(RAIZ, caminho).replace(/\\/g, '/');

  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i];
    // Stripa comentários de linha única para não disparar regex em texto explicativo.
    const idxComentario = linha.indexOf('//');
    if (idxComentario >= 0) {
      linha = linha.slice(0, idxComentario);
    }
    for (const regra of PADROES_PROIBIDOS) {
      if (regra.apenasEm && !regra.apenasEm.some((p) => relCaminho.startsWith(p))) continue;
      if (regra.regex.test(linha)) {
        problemas.push({ arquivo: relCaminho, linha: i + 1, motivo: regra.motivo, texto: linhas[i].trim() });
      }
    }
  }
  return problemas;
}

// Verifica arquivos rastreados proibidos (R-57, P-08)
function checkArquivosRastreados() {
  const proibidos = [/\.env/, /\.db$/, /backup.*\.txt$/, /^dados\//];
  const problemas = [];
  // Só verifica se existem — não lista node_modules etc.
  function walkRaiz(dir, acc) {
    for (const entry of readdirSync(dir)) {
      if (entry === '.git' || entry === 'node_modules' || entry === 'dist' || entry === 'backup') continue;
      const full = join(dir, entry);
      const st = statSync(full);
      const rel = relative(RAIZ, full).replace(/\\/g, '/');
      if (proibidos.some((p) => p.test(rel))) {
        acc.push({ arquivo: rel, linha: 0, motivo: 'R-57/P-08: arquivo proibido versionado', texto: rel });
      }
      if (st.isDirectory()) walkRaiz(full, acc);
    }
    return acc;
  }
  return walkRaiz(RAIZ, []);
}

const todosArquivos = DIRETORIOS_PARA_VARRER.flatMap((d) => walk(join(RAIZ, d)));
let problemas = [];
for (const arq of todosArquivos) {
  problemas.push(...checkArquivo(arq));
}
problemas.push(...checkArquivosRastreados());

if (problemas.length === 0) {
  console.log('check-rules: OK (nenhum padrão proibido encontrado)');
  process.exit(0);
} else {
  console.error(`check-rules: ${problemas.length} problema(s) encontrado(s):\n`);
  for (const p of problemas) {
    console.error(`  ${p.arquivo}:${p.linha}  ${p.motivo}`);
    console.error(`    ${p.texto}\n`);
  }
  process.exit(1);
}
