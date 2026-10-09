# NOTAS

## M1 (2026-10-09)

### Suposições feitas (R-04)

- **Versões fixas sem `^`**: descobertas com `npm view` conforme R-06. Para React 18 e Tailwind 3 (exigidos pelo rag.md seção 3), usei as últimas versões dessas linhas maiores (18.3.1 e 3.4.19).
- **lucide-react 0.577.0**: a versão 1.x mais recente pode ter breaking changes com React 18. Usei a última 0.x para garantir compatibilidade.
- **eslint 9.39.5 com flat config**: rag.md não especifica versão do ESLint, mas a 9.x usa flat config nativamente.
- **`eslint-plugin-react-hooks` e `eslint-plugin-react-refresh`**: adicionados como devDependencies porque são padrão para lint de React com Vite. Justificativa registrada aqui conforme R-11.
- **Página mínima do M1**: mostra hoje, mês atual, valor da hora e valor da falta. Não é o dashboard final — vem no M3.

### Decisões de arquitetura

Ver `docs/decisoes.md`.

### Pendências para os próximos marcos

- **M2**: store zustand, armazenamento local (data/storage.ts), CRUD de config, alunos, turmas, aulas, cronograma.
- **M3**: dashboard completo, calendário, fechamentos, impressão.
- **M4**: cliente GitHub (data/github.ts), motor de sync (data/sync.ts), tela de configuração, Diagnóstico, testes com GitHub falso, E2E de dois aparelhos.
- **M5**: backup, importação do histórico (data/legado.ts), aviso de privacidade, "copiar configuração".
- **M6**: revisão final contra seção 19, README completo, 20 testes manuais.

### Aviso sobre o backup

A pasta `backup/` contém o sistema anterior (Next.js + Cloudflare Worker). Não é parte do novo projeto. Pode ser removida depois que o dono confirmar que não precisa mais dos arquivos.
