📐 Sistema de Controle de AulasUm aplicativo web moderno, leve e 100% serverless projetado para professores e tutores realizarem o gerenciamento de aulas, acompanhamento de presenças/faltas, controle financeiro e gestão de alunos e turmas.O projeto roda inteiramente no navegador do usuário utilizando IndexedDB, garantindo alta performance, segurança de dados locais e facilidade de backup/sincronização sem custos com servidores ou bancos de dados externos.🚀 Teclogias UtilizadasFramework: Next.js 16 (React 19, App Router)Linguagem: TypeScriptEstilização: Tailwind CSSGerenciamento de Estado: ZustandPersistência Local: IndexedDB (via biblioteca idb)Gráficos: RechartsDeploy & CI/CD: GitHub Pages + GitHub Actions✨ Principais Funcionalidades🏠 Dashboard Financeiro & Estatísticas: Visualização rápida de aulas do mês, total ganho, horas lecionadas, resumo de presenças vs. faltas e gráficos interativos.📅 Calendário Interativo: Calendário próprio e customizado para rápida visualização mensal de compromissos por status.📝 Gestão de Aulas: Lançamento rápido de presenças, faltas e cancelamentos com cálculo automático do valor com base nas regras de duração e tipo.👥 Alunos e Turmas: Cadastro simplificado de alunos (VIP ou Turma) e agrupamento por turmas.📊 Fechamento Mensal: Geração de snapshots imutáveis ao fim de cada mês para histórico financeiro.💾 Backup & Sincronização:Exportação/Importação manual via arquivos .txt (formato JSON legível).Sincronização opcional via GitHub API (utilizando Personal Access Token - PAT).💰 Regras de Cálculo de ValoresStatusTipoDuraçãoValor CalculadoPresençaVIP1hR$ 35,00PresençaVIP1,5hR$ 52,50PresençaVIP2hR$ 70,00PresençaTurma2hR$ 70,00FaltaVIP / TurmaQualquerR$ 35,00 (equivale a 1h)CanceladaQualquerAnyR$ 0,00🏗️ Arquitetura e Fluxo de DadosO aplicativo adota uma abordagem local-first:┌─────────────────────────────────────────────┐
│  Usuário faz ação (add/editar/remover aula) │
└──────────────────┬──────────────────────────┘
                   ↓
         ┌─────────────────┐
         │   IndexedDB     │ ← Armazenamento Local Principal
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │  UI Atualizada  │
         └────────┬────────┘
                  ↓
    ┌──────────────┴──────────────┐
    ↓                             ↓
┌───────────┐            ┌─────────────────┐
│ Manual    │            │ Auto (Opcional) │
│ Exportar  │            │ Sincronização   │
│ .txt      │            │ via GitHub API  │
└───────────┘            └─────────────────┘
📁 Estrutura do Projetocontrole-aulas/
├── .github/workflows/
│   └── deploy.yml              # CI/CD: Pipeline de deploy para o GitHub Pages
├── public/
├── src/
│   ├── app/                    # Rotas da aplicação (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard Principal
│   │   ├── calendario/        # Visão em calendário
│   │   ├── aulas/             # Gerenciamento de Aulas
│   │   ├── alunos/            # Gerenciamento de Alunos
│   │   ├── turmas/            # Gerenciamento de Turmas
│   │   ├── fechamentos/       # Histórico de fechamentos mensais
│   │   └── configuracoes/     # Configurações e Backups
│   ├── components/            # Componentes reutilizáveis de UI
│   ├── lib/                   # Camadas de banco (idb), cálculos e backups
│   ├── store/                 # Gerenciamento de estado global (Zustand)
│   └── types/                 # Definições de tipos TypeScript
├── next.config.js              # Configuração com `output: 'export'`
└── package.json
🛠️ Como Executar o Projeto LocalmenteClone o repositório:git clone https://github.com/seu-usuario/controle-aulas.git
cd controle-aulas
Instale as dependências:npm install
Execute o servidor de desenvolvimento:npm run dev
Acesse no navegador:
Abra http://localhost:3000 no seu navegador.🚀 Publicação no GitHub PagesEste repositório está configurado para publicação automática utilizando GitHub Actions.Vá em Settings > Pages no repositório no GitHub.Na opção Source, selecione GitHub Actions.Toda vez que fizer um push para a branch main, o fluxo de trabalho em .github/workflows/deploy.yml fará o build estático e o deploy automaticamente para a URL:
https://<seu-usuario>.github.io/controle-aulas/📄 LicençaEste projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
