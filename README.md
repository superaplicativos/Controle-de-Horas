# 📚 Controle de Horas

Sistema de controle de horas para **um professor autônomo**. Registra aulas dadas, calcula o valor a receber, mostra dashboard, calendário, cronograma, alunos, turmas e fechamento mensal.

> **Modo de uso**: cada professor tem a SUA cópia do projeto. Faça um fork, ajuste `src/config/instancia.ts`, publique no GitHub Pages e use. Sem servidor, sem banco externo, sem login.

## O que o sistema faz

- **Dashboard** com KPIs (total a receber, horas dadas, presenças, faltas) e variação contra o mês anterior
- **Gráfico** de valor por dia do mês
- **Calendário visual** mensal com cor por status (presença, falta, cancelada, agendada) e dia atual destacado
- **Aulas dadas** com criação, edição e exclusão; valor calculado sozinho a partir da tarifa
- **Cronograma** de planejamento futuro (separado das aulas dadas)
- **Alunos e turmas** (VIP individual ou turma, ativo/inativo)
- **Fechamento mensal** com snapshot imutável; editar aula de mês fechado é bloqueado
- **Impressão** do relatório mensal via `window.print()` (CSS dedicado)
- **Sincronização** entre aparelhos via branch `dados` do GitHub (mescla, nunca substitui)
- **Backup** em arquivo `.txt` (exportar e importar)
- **Importação** do histórico do sistema anterior (Next.js)
- **Diagnóstico** com contagem local, shas, último erro, build ID

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS 3
- zustand (estado) + react-router (HashRouter)
- recharts (gráficos) + lucide-react (ícones)
- vitest (testes unitários) + Playwright (E2E)
- Dados em arquivos `.txt` (JSON) numa branch `dados` do mesmo repositório, acessados via API do GitHub com token fine-grained

## Como desenvolver

```bash
npm install
npm run verify     # typecheck + lint + check-rules + test + build
npm run dev        # servidor de desenvolvimento
npm run test:e2e   # testes E2E com Playwright (requer Chromium)
```

## Como publicar (fork para um professor)

1. Faça fork deste repositório para a conta do professor.
2. Edite `src/config/instancia.ts` com o nome do professor e valores padrão (hora e falta).
3. Em Settings → Pages, escolha "GitHub Actions" como fonte.
4. Aguarde o deploy e abra `https://<usuario>.github.io/<repositorio>/`.
5. No app, Configurações, cole o token GitHub (fine-grained, limitado a este repositório, permissão Contents: Read and write).

## Sincronização entre aparelhos

O app funciona **sem token** (modo local, dados só no navegador). Com token, sincroniza entre aparelhos via branch `dados`.

- A sincronização **mescla** por id — nunca substitui nem apaga.
- Exclusões são lápides (`excluido: true`), não remoções.
- Se dois aparelhos editarem registros diferentes, ambos ficam.
- Mutações disparam sync automático após 2 segundos (debounce).
- Mutex: no máximo um ciclo de sync por vez.

Para configurar um segundo aparelho sem digitar o token de novo: use "Copiar configuração" no primeiro e "Colar configuração" no segundo.

## Segurança e modelo de ameaça (seção 24.10)

Os dados na nuvem (branch `dados`) são **cifrados com AES-256-GCM**. A chave de dados (32 bytes aleatórios) é gerada uma única vez na primeira configuração e cifrada com a sua senha (PBKDF2-SHA256, 600.000 iterações) dentro do `acesso.txt`.

- **Repositório público?** Quem lê vê só texto cifrado. A proteção depende da força da sua senha e do PBKDF2.
- **Token:** fica dentro do `acesso.txt` cifrado. Use token fine-grained, restrito a UM repositório, permissão Contents.
- **Senha fraca?** Um atacante pode tentar adivinhá-la offline. Use no mínimo 10 caracteres, evite senhas comuns.
- **Esqueceu a senha?** A chave de recuperação (mostrada uma vez no assistente) é a única forma de recuperar. Sem a senha E sem a chave, não há recuperação.
- **Recomendação opcional:** ative um ruleset em `main` exigindo pull request, para que um token vazado não altere o código do site.

Em qualquer aparelho novo, basta digitar a senha para ver os mesmos dados — sem colar token, sem configurar nada.

## Backup e importação

- **Exportar backup .txt**: baixa arquivo legível com todos os dados + JSON completo.
- **Importar backup .txt**: mescla com o estado atual (nunca substitui). Importar duas vezes não duplica.
- **Importar histórico antigo**: baixa o backup do sistema anterior (Next.js) e converte automaticamente.

## Base de conhecimento

Toda regra de arquitetura está em `rag.md`. Leia antes de qualquer tarefa. O `scripts/check-rules.mjs` varre o código e reprova padrões proibidos em todo `npm run verify`.

## Estrutura

```
rag.md                 regras do projeto
src/
  domain/              tipos, cálculos, datas, mescla, migrações, fechamentos (puro, sem React)
  store/               zustand: store, ações, seletores
  data/                storage (localStorage), github (API), sync (motor), backup, legado
  features/            dashboard, aulas, calendario, cronograma, alunos, turmas, fechamentos, configuracoes, diagnostico
  app/                 App, Layout, rotas
  components/          TelaCorrompida
tests/                 unitários (vitest)
e2e/                   Playwright (dois aparelhos)
scripts/check-rules.mjs  padrões proibidos
```

## Backup do sistema anterior

A pasta `backup/` contém o sistema Next.js + Cloudflare Worker anterior. Não faz parte do novo projeto.
