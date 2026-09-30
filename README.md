Aqui está a **Descrição para a bio/About do GitHub** (com exatamente 347 caracteres) e, em seguida, o código completo do **README.md** formatado em Markdown para você copiar e colar diretamente no seu repositório.

---

### 📌 Descrição para o "About" do GitHub (347 caracteres)

```text
Sistema web serverless para controle e gestão de aulas, presença e fechamento financeiro. Feito com Next.js 16, TypeScript, Tailwind e IndexedDB. Permite exportação de backup em arquivo .txt (JSON) e sincronização opcional com a GitHub API. Totalmente gratuito e hospedado no GitHub Pages. 📐

```

---

### 📄 Conteúdo para o `README.md`

```markdown
# 📐 Sistema de Controle de Aulas

Um sistema moderno, leve e 100% *serverless* para gestão de aulas, controle de presença, agendamento e fechamento financeiro mensal. Desenvolvido para rodar totalmente no navegador sem necessidade de infraestrutura de servidor pagas.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 🚀 Teclogias & Arquitetura

O projeto foi desenhado para ser eficiente, gratuito e ter zero dependência de banco de dados na nuvem.

| Camada | Tecnologia | Motivo da escolha |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 + TypeScript + Tailwind | Moderno, performático, typagem estática e facilidade de manutenção. |
| **Build & Deploy** | `next export` → GitHub Pages | 100% gratuito, estático e sem custo de hospedagem. |
| **Persistência Principal** | IndexedDB (via `idb`) | Processamento assíncrono, suporta alto volume de dados no navegador. |
| **Backup / Exportação** | Arquivo `.txt` (JSON) | Portabilidade e atende ao requisito de versionamento fácil via arquivo. |
| **Sincronização Opcional**| GitHub API | Sincronização multi-dispositivo sem custo usando Personal Access Token (PAT). |
| **Calendário** | Componente Custom (React) | Leve, customizável, sem dependências de libs pesadas. |
| **Gráficos** | Recharts | Visualização de métricas com gráficos responsivos. |

> **Por que IndexedDB e não LocalStorage?**  
> O `LocalStorage` possui limite reduzido (~5MB) e execução síncrona. O `IndexedDB` suporta volumes muito maiores de dados, funciona de maneira assíncrona e permite consultas estruturadas — ideal para o acúmulo de histórico mensal ao longo dos anos.

---

## 📁 Modelo de Dados

### Entidades Principal (`/src/types/index.ts`)

```typescript
// ALUNO
export interface Aluno {
  id: string;
  nome: string;
  tipo: 'vip' | 'turma';
  turma_id: string | null; // Preenchido se tipo === 'turma'
  ativo: boolean;
  criado_em: number;
}

// TURMA
export interface Turma {
  id: string;
  nome: string; // ex: "Turma A - Matemática"
  criado_em: number;
}

// AULA
export interface Aula {
  id: string;
  aluno_id: string;
  data: string; // 'YYYY-MM-DD'
  horario: string; // 'HH:MM'
  duracao: 1 | 1.5 | 2; // Horas
  status: 'presenca' | 'falta' | 'cancelada';
  conteudo: string;
  valor: number; // Calculado automaticamente
  mes_ref: string; // 'YYYY-MM'
  criado_em: number;
}

// FECHAMENTO MENSAL (Snapshot Imutável)
export interface FechamentoMensal {
  mes: string; // 'YYYY-MM'
  total_aulas: number;
  total_horas: number;
  total_ganhos: number;
  faltas: number;
  presencas: number;
  snapshot_json: string; // Backup legível do mês
  fechado_em: number;
}

// CONFIGURAÇÕES
export interface Configs {
  valor_hora: number; // Default: R$ 35,00
  valor_falta: number; // Fixo por hora (R$ 35,00)
}

```

### 💰 Regras de Cálculo de Valor

| Status | Tipo | Duração | Valor Calculado |
| --- | --- | --- | --- |
| **Presença** | VIP | 1h | R$ 35,00 |
| **Presença** | VIP | 1,5h | R$ 52,50 |
| **Presença** | VIP | 2h | R$ 70,00 |
| **Presença** | Turma | 2h | R$ 70,00 |
| **Falta** | VIP / Turma | Qualquer | R$ 35,00 *(conta 1h padrão)* |
| **Cancelada** | Qualquer | Qualquer | R$ 0,00 *(não contabiliza)* |

---

## 📂 Estrutura do Projeto

```text
controle-aulas/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: Pipeline de build e deploy no GH Pages
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard / Home
│   │   ├── calendario/page.tsx # Visão de calendário mensal
│   │   ├── aulas/page.tsx      # Gestão/CRUD de aulas
│   │   ├── alunos/page.tsx     # Gestão/CRUD de alunos
│   │   ├── turmas/page.tsx     # Gestão/CRUD de turmas
│   │   ├── fechamentos/page.tsx# Histórico e snapshots mensais
│   │   └── configuracoes/page.tsx # Configurações, backup e sync
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos de UI
│   │   ├── Calendar.tsx        # Componente customizado de calendário
│   │   ├── AulaForm.tsx        # Formulário de lançamento de aulas
│   │   ├── DashboardCards.tsx  # Cards de resumo do dashboard
│   │   └── Sidebar.tsx         # Navegação do sistema
│   ├── lib/
│   │   ├── db.ts               # Camada de abstração do IndexedDB
│   │   ├── calculations.ts     # Regras de negócios e cálculo de valores
│   │   ├── backup.ts           # Métodos de Export/Import em .txt
│   │   └── github-sync.ts     # Integração opcional via GitHub API
│   ├── types/
│   │   └── index.ts            # Definições de interfaces do TypeScript
│   └── store/
│       └── useStore.ts         # Gerenciamento de estado global (Zustand)
├── next.config.js              # Configuração com output: 'export'
├── package.json
└── README.md

```

---

## 🔄 Fluxo de Persistência e Sync

```text
┌─────────────────────────────────────────────┐
│  Usuário faz ação (add/editar/remover aula) │
└──────────────────┬──────────────────────────┘
                   ↓
         ┌─────────────────┐
         │   IndexedDB     │ ← Armazenamento Local Principal
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │   UI Atualiza   │
         └────────┬────────┘
                  ↓
    ┌──────────────┴──────────────┐
    ↓                             ↓
┌───────────┐            ┌─────────────────┐
│  Manual   │            │ Auto (opcional) │
│           │            │                 │
│ Exportar  │            │  GitHub API     │
│  .txt     │            │ Commit no Repo  │
└───────────┘            └─────────────────┘

```

---

## ⚙️ Como Executar o Projeto Localmente

1. **Clone o repositório:**
```bash
git clone [https://github.com/SEU_USUARIO/controle-aulas.git](https://github.com/SEU_USUARIO/controle-aulas.git)
cd controle-aulas

```


2. **Instale as dependências:**
```bash
npm install

```


3. **Execute o ambiente de desenvolvimento:**
```bash
npm run dev

```


4. Acesse em seu navegador a URL `http://localhost:3000`.

---

## 🌐 Deploy Automático no GitHub Pages

Este projeto está configurado para publicar automaticamente através do **GitHub Actions**.

### Passos para ativar:

1. Suba o código para o seu repositório no GitHub.
2. Acesse a aba **Settings** do repositório no GitHub.
3. No menu lateral, navegue até **Pages**.
4. Em **Source**, selecione a opção **GitHub Actions**.
5. Realize qualquer `git push` na branch `main`. A Action `.github/workflows/deploy.yml` fará o build e publicação.

URL final da aplicação:
`https://<seu-usuario>.github.io/controle-aulas/`

---

## 📄 Licença

Este projeto está sob a licença [MIT](https://www.google.com/search?q=./LICENSE).

```

```
