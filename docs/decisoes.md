# Decisões de arquitetura (ADR curtas)

## ADR-001: Vite em vez de Next.js

**Problema**: o sistema anterior usava Next.js com `output: export`, mas isso trouxe complexidade desnecessária (rotas de API que não funcionam em estático, dependências pesadas, build lento).

**Decisão**: Vite + React 18 + react-router HashRouter.

**Por que não dá para fazer sem**: o rag.md (D-01) exige 100% estático no GitHub Pages. Vite é mais simples e rápido para esse caso. HashRouter (R-58) evita 404 em qualquer nome de repositório.

## ADR-002: Tailwind 3 em vez de Tailwind 4

**Problema**: Tailwind 4 mudou a API de configuração (sem `tailwind.config.js`, CSS-first).

**Decisão**: Tailwind 3.4.19 com `tailwind.config.js` clássico.

**Por que não dá para fazer sem**: o rag.md (seção 3) fixa Tailwind CSS 3. A API do 4 ainda está mudando e quebra configs existentes.

## ADR-003: ESLint 9 com flat config

**Problema**: rag.md não especifica versão do ESLint.

**Decisão**: ESLint 9.39.5 com flat config (`eslint.config.js`).

**Por que não dá para fazer sem**: ESLint 9 é a versão estável atual. Flat config é o padrão dela. `.eslintrc` está deprecated.

## ADR-004: lucide-react 0.577.0 em vez de 1.x

**Problema**: lucide-react 1.x foi lançado recentemente e pode ter breaking changes com React 18.

**Decisão**: fixar em 0.577.0 (última 0.x).

**Por que não dá para fazer sem**: rag.md (seção 3) exige React 18. A 1.x pode quebrar.

## ADR-005: Backup do sistema anterior em `backup/`

**Problema**: o usuário pediu para preservar o diretório anterior antes de iniciar o novo.

**Decisão**: todos os arquivos do projeto Next.js anterior foram movidos para `backup/`. O `.git` foi preservado, então o histórico de commits continua acessível.

**Por que não dá para fazer sem**: o dono pode precisar consultar o código antigo. `backup/` está no `.gitignore` do eslint e do check-rules para não interferir.
