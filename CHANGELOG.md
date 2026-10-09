# CHANGELOG

## 2026-10-09 — M6: revisão final, README, 20 testes manuais

- Revisão contra seção 19 (proibições): corrigido `localStorage.clear()` em store.ts (movido para storage.ts como `limparTudo`).
- Removida dependência `date-fns` (sem uso — helpers próprios em `domain/datas.ts`).
- README reescrito (P-10: só afirma o que o app faz).
- `docs/testes-manuais.md` com os 20 testes finais (R-90).
- `npm run verify` verde com 124 testes.

## 2026-10-09 — M5: backup, importação legado, copiar/colar configuração

- `data/backup.ts`: gerarBackupTxt, baixarBackup, importarBackupTxt (mescla, nunca substitui).
- `data/legado.ts`: baixarEImportarLegado baixa do commit 2e4bc877 e converte.
- `data/storage.ts`: copiarConfiguracao e colarConfiguracao (R-53, base64).
- Tela de Configurações com UI de backup, legado e copiar/colar.
- 15 testes cobrindo round-trip, idempotência, conversão legado.

## 2026-10-09 — M4: sync via GitHub, Diagnóstico, testes com mock

- `data/github.ts`: único fetch para api.github.com (R-36), base64 UTF-8 (R-37), escritas seriais (R-38), criar branch dados (R-39).
- `data/sync.ts`: motor com mutex (R-42), baixa tudo, mescla (R-44), retry 409.
- `features/diagnostico/Diagnostico.tsx`: contagem, shas, reler nuvem, build ID.
- Tela de Configurações com sync (repo/branch/token, aviso público R-56).
- 6 testes com GitHub falso em memória.

## 2026-10-09 — M3: dashboard, calendário, fechamentos, impressão

- `domain/fechamentos.ts`: criarFechamento (snapshot imutável R-25), divergeDoSnapshot.
- Dashboard com KPIs, variação vs mês anterior (R-24), gráfico recharts.
- Calendário visual com dia atual destacado e cor por status.
- Fechamentos com selo de divergência.
- Impressão via window.print() com CSS @media print (R-51).
- 14 testes de fechamentos.

## 2026-10-09 — M2: store, armazenamento local, CRUD completo

- `data/storage.ts`: único que toca localStorage (R-33, 3 chaves).
- `store/store.ts` + `store/acoes.ts` + `store/seletores.ts`: CRUD de config, alunos, turmas, aulas, cronograma.
- Lápides (P-03), valor calculado ao salvar (R-22), R-20 mudança de mês.
- 27 testes de ações.

## 2026-10-09 — M1: base do projeto

- Backup do sistema anterior movido para `backup/`.
- Projeto Vite + React 18 + TypeScript strict criado do zero seguindo `rag.md`.
- `src/domain/` completo: tipos, cálculos, datas, mescla, migrações.
- 57 testes unitários.
- `scripts/check-rules.mjs` varrendo padrões proibidos.
- Workflow de deploy com `verify` completo + verificação pós-build (R-62).
- Página mínima publicada.
