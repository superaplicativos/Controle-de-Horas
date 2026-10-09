# 📚 Controle de Horas

Sistema de controle de horas para **um professor autônomo**. Registra aulas dadas, calcula o valor a receber, mostra dashboard, calendário, cronograma, alunos, turmas e fechamento mensal.

> **Modo de uso**: cada professor tem a SUA cópia do projeto. Faça um fork, ajuste `src/config/instancia.ts`, publique no GitHub Pages e use. Sem servidor, sem banco externo, sem login.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS 3
- zustand (estado) + react-router (HashRouter)
- recharts (gráficos) + lucide-react (ícones)
- vitest (testes) + Playwright (E2E)
- Dados em arquivos TXT (JSON) numa branch `dados` do mesmo repositório, acessados via API do GitHub com token fine-grained

## Como desenvolver

```bash
npm install
npm run verify     # typecheck + lint + check-rules + test + build
npm run dev        # servidor de desenvolvimento
```

## Como publicar (fork)

1. Faça fork deste repositório para a sua conta.
2. Edite `src/config/instancia.ts` com seu nome e valores padrão.
3. Em Settings → Pages, escolha "GitHub Actions" como fonte.
4. Aguarde o deploy e abra `https://<seu-usuario>.github.io/<repositorio>/`.
5. No app, Configurações, cole seu token GitHub (fine-grained, limitado a este repositório, permissão Contents: Read and write).

## Sincronização entre aparelhos

O app funciona sem token (modo local, dados só no navegador). Com token, sincroniza entre aparelhos via branch `dados`. A sincronização **mescla** — nunca substitui nem apaga. Exclusões são lápides (`excluido: true`).

## Privacidade

Se o repositório de dados for público, qualquer pessoa lê os arquivos da branch `dados` (nomes de alunos). Recomendado: apontar o sync para um repositório **privado**. O app detecta repositório público e mostra aviso.

## Base de conhecimento

Toda regra de arquitetura está em `rag.md`. Leia antes de qualquer tarefa.

## Backup do sistema anterior

A pasta `backup/` contém o sistema Next.js + Cloudflare Worker anterior. Não faz parte do novo projeto. Pode ser removida depois de confirmado que não é mais necessária.
