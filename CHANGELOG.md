# CHANGELOG

## 2026-10-09 — M1: base do projeto

- Backup do sistema anterior movido para `backup/`.
- Projeto Vite + React 18 + TypeScript strict criado do zero seguindo `rag.md`.
- `src/domain/` completo: tipos, cálculos, datas, mescla, migrações.
- Testes unitários cobrindo cálculo (9 casos), datas (10 casos), mescla (10 casos), migrações (4 casos).
- `scripts/check-rules.mjs` varrendo padrões proibidos (F-01, F-06, F-09, P-04, R-55, R-57, D-03).
- Workflow de deploy com `verify` completo + verificação pós-build (R-62).
- Página mínima publicada mostrando hoje, mês atual e valores padrão.
- `npm run verify` verde.
