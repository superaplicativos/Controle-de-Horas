# 📚 Controle de Aulas

Sistema de controle de aulas para professores — VIP e Turma. Totalmente client-side, hospedado no GitHub Pages (grátis, sem servidor).

## ✨ Funcionalidades

- 🔐 **Multi-professor**: cada um com seu painel isolado (login com usuário/senha)
- 📊 **Dashboard completo**: KPIs, gráficos de barras, pizza, linha e área
- 📅 **Calendário**: visão mensal com dia atual destacado
- 📝 **CRUD de Aulas**: com cálculo automático de valor (presença, falta, cancelada)
- 👥 **Alunos e Turmas**: VIP (1h, 1.5h, 2h) e Turma (sempre 2h)
- 📈 **Fechamentos mensais**: snapshot imutável no fim de cada mês
- ☁️ **Sync via GitHub**: dados salvos em `data/backup.txt` no repo, puxados automaticamente ao abrir
- 💾 **Backup local**: exportar/importar `.txt` legível

## 💰 Regras de cálculo

| Status | Tipo | Duração | Valor |
|--------|------|---------|-------|
| Presença | VIP | 1h | R$ 35,00 |
| Presença | VIP | 1,5h | R$ 52,50 |
| Presença | VIP | 2h | R$ 70,00 |
| Presença | Turma | 2h | R$ 70,00 |
| **Falta** | VIP/Turma | qualquer | **R$ 35,00** (1h fixa) |
| Cancelada | qualquer | — | R$ 0,00 |

> Valores configuráveis por professor em **Perfil**.

## 🚀 Deploy no GitHub Pages

### Opção A: Automático (recomendado)

1. Faça fork/clone deste repo
2. Vá em **Settings → Pages → Source: GitHub Actions**
3. Faça um push na branch `main`
4. O GitHub Action builda e publica automaticamente
5. Acesse: `https://<seu-usuario>.github.io/Controle-de-Horas/`

### Opção B: Manual

```bash
bun install
bun run build
# Pubique a pasta `out/` na branch gh-pages
```

## ⚙️ Configuração do Sync GitHub (multi-dispositivo)

Para que os dados sejam sincronizados entre dispositivos:

1. Crie um Personal Access Token (fine-grained) em:
   `GitHub → Settings → Developer settings → Personal access tokens → Fine-grained`
2. Permissões: **Contents (read & write)** no repo
3. No app, vá em **Configurações** e cole o token + repo (ex: `seu-user/Controle-de-Horas`)
4. Pronto! Ao abrir o app em outro dispositivo, ele puxa os dados automaticamente

## 👤 Conta demo

- Usuário: `guilherme`
- Senha: `professor123`

> Já vem com dados de setembro/2025 pré-cadastrados para demonstração.

## 🛠️ Stack

- Next.js 16 + TypeScript + Tailwind CSS 4
- shadcn/ui + Radix UI + Lucide icons
- IndexedDB (via `idb`) para armazenamento local
- GitHub Contents API para sync multi-dispositivo
- Recharts para visualizações
- SHA-256 + salt para hash de senhas (Web Crypto API)

## ⚠️ Limitações

- 100% client-side: dados ficam no navegador (IndexedDB)
- Sync entre dispositivos requer GitHub PAT configurado
- "Segurança" é client-side: senhas são hasheadas, mas alguém com DevTools avançado pode contornar o route guard
- Para uso interno de professor é mais que suficiente

## 📝 Licença

MIT — fique à vontade para usar, modificar e distribuir.
