# rag.md: Base de conhecimento do projeto Controle de Horas

Este arquivo é a fonte única de verdade para qualquer agente de IA que trabalhe neste repositório. Ele fica na raiz do projeto. Leia o arquivo inteiro antes de qualquer tarefa. Em caso de conflito entre este arquivo e um pedido do usuário no chat, siga este arquivo e registre o conflito em NOTAS.md.

Formato pensado para recuperação: cada regra tem um código estável (P, R, F, D) para ser citado em commits e relatórios. Exemplo: "respeita P-03 e R-12".

Revisão 2: a seção 24 (acesso por senha e criptografia) substitui o antigo "modo local solto". Em caso de conflito entre a seção 24 e qualquer regra anterior, vale a seção 24.

---

## 0. Como o agente deve usar este arquivo

R-01 Antes de escrever código, releia as seções citadas na tarefa e a seção 17 (protocolo) e a seção 19 (proibições).

R-02 Uma tarefa por vez. Nunca execute duas tarefas na mesma resposta, mesmo que o usuário cole várias. Execute a primeira, entregue a evidência (seção 17) e pare.

R-03 Não diga "feito", "corrigido" ou "pronto" sem a evidência da seção 17. Afirmação sem saída de comando colada é considerada falsa.

R-04 Se faltar informação, escolha a opção mais simples permitida por este arquivo e registre a suposição em NOTAS.md. Não invente arquitetura paralela, não crie "versão alternativa" de um módulo existente.

R-05 Antes de criar qualquer arquivo ou função, procure se ela já existe (grep). Duplicar implementação é falha F-12.

R-06 Nunca invente número de versão de pacote. Use `npm view <pacote> version` e fixe a versão exata encontrada.

R-07 Edite só o trecho necessário. Nunca reescreva um arquivo inteiro para mudar poucas linhas. Arquivo novo pode ser escrito completo.

R-08 Se uma função ainda não pode ser implementada, ela deve lançar `throw new Error('NAO_IMPLEMENTADO: nome')`. Função vazia, retorno silencioso ou "TODO" sem erro é proibido (F-06).

---

## 1. Contexto e escopo

O produto é um sistema profissional de controle de horas para UM professor. Registra aulas dadas, calcula o valor a receber, mostra dashboard, calendário, cronograma, alunos, turmas e fechamento mensal.

D-01 Hospedagem: 100% GitHub Pages (site estático). Sem servidor, sem banco de dados externo, sem Cloudflare, sem Workers, sem serviço pago.

D-02 Uso individual. Cada professor tem a SUA cópia do projeto: o dono faz um fork, publica no repositório do professor e entrega o endereço do Pages. Existe exatamente um usuário por instalação.

D-03 Não existe e não deve ser criado: contas de usuário, login em servidor, cadastro, multi-professor, painel admin, assinatura, pagamento, landing page de vendas, isolamento entre usuários, campo `professor_id` em qualquer registro. A única exceção é a senha do sistema da seção 24, usada só para decifrar os dados. Se o agente sentir vontade de criar qualquer outro item da lista, está violando o escopo.

D-04 Dados: arquivos TXT (conteúdo JSON) guardados num repositório GitHub, acessados direto do navegador pela API do GitHub com um token. Por padrão o repositório de dados é o MESMO repositório do site, numa branch separada chamada `dados`. Isso evita que gravar dados dispare novo deploy do site (F-07).

D-05 Todo aparelho novo passa pelo fluxo de acesso da seção 24 (primeira configuração ou senha). Não existe modo "local solto": dado nunca fica preso num navegador (F-20).

D-06 Expansível: cada funcionalidade vive num módulo próprio (seção 20) e o modelo de dados é versionado e migrável.

D-07 Idioma da interface: português do Brasil. Moeda: BRL. Fuso: horário local do navegador (America/Sao_Paulo para o dono).

---

## 2. Princípios invioláveis

P-01 Uma única fonte de verdade na interface: o store (seção 9). As telas leem só do store.

P-02 A sincronização só MESCLA. Ela nunca substitui o local por completo e nunca apaga dado local. Não existe operação "apagar tudo e importar" em lugar nenhum do código.

P-03 Exclusão é lápide: marca `excluido: true` e atualiza `atualizadoEm`. Nunca remove o registro do estado.

P-04 Dinheiro em centavos inteiros. Nunca float (F-10).

P-05 Datas são strings `AAAA-MM-DD`. Nunca `new Date('AAAA-MM-DD')` (F-09).

P-06 Todo erro é visível ao usuário e registrado no Diagnóstico. Nenhum `catch` silencioso (F-06).

P-07 Todo código é checado por máquina antes de entrar: typecheck, lint, regras do projeto (`check-rules`), testes e build. Se algum falhar, a tarefa não está pronta (F-01).

P-08 Nenhuma credencial, dado real de aluno ou arquivo de banco entra no repositório do código (F-08).

P-09 Só existe uma implementação de cada coisa: um cliente da API do GitHub, um motor de sync, um store, uma função de cálculo.

P-10 O site só afirma o que o app realmente faz. README e textos de tela não prometem funções inexistentes (F-11).

P-11 Nenhum dado fica preso num navegador. O localStorage é só cache. Um aparelho novo chega ao mesmo estado digitando a senha do sistema, sem colar token (F-20).

P-12 A primeira tela de qualquer aparelho nunca é um dashboard vazio: é o assistente de primeira configuração, a tela de senha ou o app já desbloqueado (R-71).

---

## 3. Stack e dependências

Stack fixa:

| Camada | Escolha |
| --- | --- |
| Build | Vite |
| UI | React 18 + TypeScript (strict) |
| Estilo | Tailwind CSS 3 |
| Estado | zustand |
| Rotas | react-router-dom com HashRouter |
| Datas | date-fns (formatação) e helpers próprios (seção 8) |
| Gráficos | recharts |
| Ícones | lucide-react |
| Testes | vitest, @testing-library/react, @playwright/test |
| Gerenciador | npm com package-lock.json commitado |

R-10 Versões exatas, sem `^` nem `~`, descobertas com `npm view`.

R-11 Dependência nova só com justificativa escrita em docs/decisoes.md (qual problema resolve, por que não dá para fazer sem ela). Cada dependência declarada precisa ser importada em algum arquivo de `src`. Dependência sem uso é removida na mesma tarefa.

Proibidas: next, prisma, @prisma/client, next-auth, qualquer pacote `@cloudflare/*`, react-query, redux, service workers e bibliotecas de PWA, bibliotecas de PDF (o PDF é `window.print` com CSS de impressão), fontes ou scripts carregados de CDN.

---

## 4. Estrutura de pastas

```
/
  rag.md                 este arquivo
  NOTAS.md               suposições e dúvidas do agente
  CHANGELOG.md           uma linha por tarefa concluída
  README.md              uso, token, fork, privacidade
  docs/decisoes.md       decisões de arquitetura (ADR curtas)
  scripts/check-rules.mjs  regras de código checadas por máquina
  .github/workflows/deploy.yml
  index.html
  vite.config.ts
  src/
    main.tsx
    app/                 App.tsx, rotas, layout, AppShell
    config/instancia.ts  nome do professor, valores padrão (editado por fork)
    domain/              tipos e regras puras, sem React, sem I/O
      tipos.ts
      calculos.ts
      datas.ts
      mescla.ts
      migracoes.ts
    store/               zustand: store.ts, seletores.ts, acoes.ts
    data/                persistência e rede
      storage.ts         ÚNICO arquivo que toca localStorage
      github.ts          ÚNICO arquivo que chama fetch na API do GitHub
      sync.ts            motor de sincronização (singleton)
      backup.ts          exportar e importar TXT
      legado.ts          importação do histórico antigo
      cripto.ts          ÚNICO arquivo que usa crypto.subtle (AES-GCM, PBKDF2)
      acesso.ts          máquina de estados de acesso e assistente (seção 24)
      senhas-comuns.ts   lista de 100 senhas rejeitadas
    features/            um diretório por módulo de tela
      dashboard/ aulas/ calendario/ cronograma/ alunos/ turmas/
      fechamentos/ configuracoes/ diagnostico/
    components/          componentes de UI reutilizáveis
  tests/                 unitários (vitest)
  e2e/                   Playwright
```

R-12 `domain/` não importa React, store, storage nem rede. `features/` não importa `data/` diretamente: fala só com o store e suas ações. Só `data/` conhece GitHub e localStorage.

R-13 Nomes de domínio em português (Aula, Aluno, Turma, Fechamento). Nomes técnicos em inglês curto (store, sync, storage). Não renomeie nada depois de criado sem registrar em docs/decisoes.md.

---

## 5. Convenções

R-14 Arquivos de código em kebab-case ou camelCase de forma consistente com a pasta; componentes em PascalCase.

R-15 Componentes com no máximo 200 linhas. Passou disso, extraia.

R-16 Nenhum estado derivado em `useEffect`. Se o valor pode ser calculado dos dados do store, calcule no render ou num seletor (evita o erro de lint "set state in effect", F-17).

R-17 Textos de interface ficam no componente, em português claro. Sem internacionalização.

R-18 Sem comentários que repitam o código. Comente só o porquê de uma decisão não óbvia.

---

## 6. Modelo de dados

Todo registro persistido tem:

```ts
interface Registro {
  id: string;            // crypto.randomUUID()
  atualizadoEm: number;  // Date.now() na última alteração
  excluido?: true;       // lápide
}
```

```ts
interface Config {          // objeto único, não é lista
  nome: string;
  valorHoraCentavos: number;   // padrão 3500
  valorFaltaCentavos: number;  // padrão 3500
  atualizadoEm: number;
}
interface Aluno extends Registro { nome: string; tipo: 'vip' | 'turma'; turmaId?: string; ativo: boolean; }
interface Turma extends Registro { nome: string; }
type StatusAula = 'presenca' | 'falta' | 'cancelada' | 'agendada';
interface Aula extends Registro {
  data: string;            // AAAA-MM-DD
  horario?: string;        // HH:MM
  tipo: 'vip' | 'turma';
  alunoId?: string;
  turmaId?: string;
  alunoNome: string;       // copiado no momento do registro
  duracaoMin: number;
  status: StatusAula;
  conteudo?: string;
  valorCentavos: number;   // calculado ao salvar
  mesRef: string;          // AAAA-MM, derivado de data
}
interface CronogramaItem extends Registro { data: string; horario?: string; titulo: string; alunoNome?: string; duracaoMin?: number; observacao?: string; }
interface Fechamento extends Registro { mesRef: string; totalAulas: number; totalMinutos: number; totalCentavos: number; totalFaltas: number; totalPresencas: number; fechadoEm: number; }
```

R-19 Estado completo: `{ versaoFormato: 1, config, alunos, turmas, aulas, cronograma, fechamentos }`. Toda mudança de formato incrementa `versaoFormato` e ganha uma função em `domain/migracoes.ts`. Arquivo com versão maior que a do app: recusar com erro explicativo, nunca tentar adivinhar.

R-20 Mudar a data de uma aula para outro mês: gravar uma nova aula (novo id) e marcar a antiga como excluída. Isso mantém cada arquivo mensal consistente.

---

## 7. Regras de negócio e cálculo

R-21 Função pura em `domain/calculos.ts`:

```ts
calcularValorAulaCentavos(status, duracaoMin, valorHoraCentavos, valorFaltaCentavos): number
```

Presença: `Math.round(valorHoraCentavos * duracaoMin / 60)`. Falta: `valorFaltaCentavos` fixo, contando como 60 minutos. Cancelada e agendada: 0 e não contam horas.

R-22 O valor é calculado ao salvar a aula e gravado em `valorCentavos`. Ao editar, recalcula. Relatórios somam `valorCentavos` gravado, nunca recalculam com a tarifa atual (mudar a tarifa não altera o passado).

R-23 Resumo do mês (`calcularResumoMes`): total a receber, minutos, presenças, faltas, canceladas, agendadas, valor por dia. Excluídos são ignorados.

R-24 Variação contra o mês anterior em porcentagem inteira; se o anterior for 0, mostrar "novo" em vez de infinito.

R-25 Fechar mês grava um snapshot imutável. Editar aula de mês fechado pede confirmação e mostra o selo "alterado após fechamento" quando os totais atuais divergirem do snapshot. O snapshot nunca é recalculado.

---

## 8. Datas

R-26 `domain/datas.ts` exporta: `hojeLocal()`, `mesRefDe(data)`, `diaDaSemana(data)`, `nomeMes(mesRef)`, `somarMes(mesRef, n)`, `diasDoMes(mesRef)`. Todos montam `new Date(ano, mes - 1, dia)` local a partir dos números, e formatam manualmente com zeros à esquerda.

R-27 Proibido em todo o código: `new Date('AAAA-MM-DD')`, `Date.parse` de string de data, `toISOString().slice/split` para obter data local. O check-rules reprova esses padrões.

R-28 Timestamps de alteração (`atualizadoEm`) usam `Date.now()`; datas de negócio usam as strings acima. Nunca misture os dois.

---

## 9. Estado e interface

R-29 Um único store zustand com `config, alunos, turmas, aulas, cronograma, fechamentos, sync`. Mutações acontecem só por ações (`store/acoes.ts`). Toda ação: valida, atualiza o store, grava no armazenamento local, marca o arquivo afetado como pendente e agenda o sync.

R-30 Telas leem por seletores. Nenhuma tela lê localStorage, chama fetch ou chama o motor de sync diretamente. O botão "Sincronizar agora" chama a ação `sincronizar()`.

R-31 Quando o sync mescla dados, ele atualiza o store de uma vez (uma única chamada `set`). A interface reage sozinha. É proibido criar hooks de "recarregar" ou eventos manuais de atualização (F-06, F-15).

R-32 O estado é lido de forma síncrona do armazenamento local antes do primeiro render. Não existe tela de carregamento com dados vazios.

---

## 10. Persistência local

R-33 `data/storage.ts` é o único arquivo que usa `localStorage`. Três chaves, e só elas:

| Chave | Conteúdo |
| --- | --- |
| `ch:estado:v1` | estado completo de dados |
| `ch:sync:v1` | `{ repo, branch, token, chaveDados }` (chaveDados em base64) |
| `ch:meta:v1` | `{ shas: Record<caminho, sha>, pendentes: string[], ultimoSync, ultimoErro }` |

R-34 Se o armazenamento local estiver corrompido, não apague: mostre erro explicativo com botão "baixar cópia do conteúdo bruto" e abra com estado vazio sem sobrescrever a chave até o usuário confirmar.

---

## 11. Sincronização

### 11.1 Layout dos dados (branch `dados`)

```
dados/config.txt
dados/cadastros.txt        { alunos, turmas }
dados/cronograma.txt
dados/fechamentos.txt
dados/aulas/AAAA-MM.txt    um arquivo por mês
```

Cada arquivo: JSON com 2 espaços, campo `versaoFormato`, extensão `.txt`. Mutação de uma aula de 2026-09 marca como pendente só `dados/aulas/2026-09.txt`.

### 11.2 Repositório padrão

R-35 `detectarRepositorio()`: se o host termina em `.github.io`, `owner` = primeiro rótulo do host e `repo` = primeiro segmento do caminho. Isso preenche o repositório automaticamente. Em domínio próprio ou localhost, o usuário digita `usuario/repositorio`. A branch padrão é `dados`.

### 11.3 Cliente da API (`data/github.ts`)

R-36 Único lugar com `fetch` para `api.github.com`. Cabeçalhos: `Authorization: Bearer TOKEN`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`. Em todo GET: `cache: 'no-store'` e parâmetro `t=Date.now()`.

R-37 Base64 sempre seguro para UTF-8: `TextEncoder`/`TextDecoder`, removendo quebras de linha do base64 recebido. Nunca `btoa(string)` direto.

R-38 Escritas (PUT) são seriais, com intervalo mínimo de 1 segundo entre elas (limite secundário do GitHub).

R-39 Se a branch `dados` não existir: criar a partir do sha da branch padrão do repositório via `POST /git/refs`. Se não for possível, erro visível explicando.

R-40 Comparar o relógio do aparelho com o cabeçalho `Date` das respostas. Diferença maior que 5 minutos: aviso persistente "relógio do aparelho desajustado, a mescla pode errar".

### 11.4 Algoritmo (um ciclo)

```
sincronizar():
  se já existe ciclo em andamento: marcar "rodar de novo" e retornar a mesma Promise
  status = 'sincronizando'
  garantirBranch()
  arquivos = listar('dados/') + listar('dados/aulas/')     // 404 = pasta ainda não existe
  para cada caminho em (arquivos remotos com sha diferente do guardado) ∪ pendentes:
      remoto = baixar(caminho)                              // pode não existir
      mesclado = mesclar(local[caminho], remoto)
      aplicarNoStore(mesclado)                              // set único
      guardar sha remoto
  para cada caminho cujo conteúdo local difere do remoto:
      tentar até 3x:
         PUT contents { message: 'sync AAAA-MM-DDTHH:MM', content, branch, sha? }
         ok: guardar novo sha, remover de pendentes
         409 ou 422: baixar remoto, mesclar, repetir
      falhou 3x: status 'erro' com mensagem completa; caminho continua pendente
  status = 'sincronizado em HH:MM'
  se "rodar de novo": executar mais um ciclo
```

R-41 Gatilhos: abertura do app; aba volta a ficar visível há mais de 20 s; 2 s depois de qualquer mutação (debounce); evento `online`; botão "Sincronizar agora". Não existe listener de `focus`.

R-42 Mutex: no máximo um ciclo em execução. Pedidos durante um ciclo viram UM ciclo seguinte.

R-43 Proibido: limpar o estado local antes de importar; "espelhar" a nuvem; usar o sync para apagar. A mescla é a única operação que combina local e remoto.

### 11.5 Mescla (`domain/mescla.ts`, função pura)

R-44 `mesclarRegistros(local, remoto)`: une por `id`. Se o id existe nos dois lados, vence o maior `atualizadoEm`; empate vence o remoto. Lápide é registro normal e vence se for a mais recente. Registro presente só no local ou só no remoto permanece. Saída ordenada por `id` para ser estável. `mesclarConfig`: vence o maior `atualizadoEm`.

R-45 Propriedades obrigatórias, testadas: comutatividade do resultado final, idempotência (mesclar duas vezes é igual a mesclar uma), nenhum registro some.

R-46 Lápides nunca são removidas. O custo é desprezível para uso individual e evita o ressurgimento de registros apagados.

### 11.6 Status e erros

R-47 Status no topo da tela: `Somente neste aparelho`, `Sincronizando`, `Sincronizado às HH:MM`, `Erro` (mensagem completa e botão "tentar de novo"). Falha de rede vira `Erro` e mantém os pendentes.

---

## 12. Backup e importação

R-48 Exportar: baixa um arquivo TXT com o estado completo. Importar: MESCLA com o estado atual, nunca substitui.

R-49 Importação do histórico antigo (`data/legado.ts`): baixa
`https://raw.githubusercontent.com/superaplicativos/Controle-de-Horas/2e4bc877a021361527588bdfebd65d223bd59f5c/data/backup.txt`.
O texto tem uma seção entre as linhas `----- JSON COMPLETO -----` e `----- FIM -----` com JSON `{ alunos, turmas, aulas, cronograma, fechamentos }`.

Mapeamento: aula `duracao` (horas decimais) vira `duracaoMin = Math.round(duracao * 60)`; `valor` (reais) vira `valorCentavos = Math.round(valor * 100)`; `aluno_id`, `aluno_nome`, `aluno_tipo`, `mes_ref`, `turma_id` viram `alunoId`, `alunoNome`, `tipo`, `mesRef`, `turmaId`. Manter os ids antigos para a importação ser idempotente. `atualizadoEm` = `criado_em` quando existir, senão `Date.now()`. Ignorar `professor_id`. Resultado esperado hoje: 27 aulas, 9 alunos e as turmas. Importar duas vezes não duplica.

---

## 13. Funções do produto (especificação funcional)

Navegação: barra lateral no desktop; barra inferior no celular (Início, Aulas, Calend., Alunos, Mais). Tema claro, cor principal esmeralda, cartões arredondados, responsivo a partir de 375 px.

Dashboard. Seletor de mês com setas. KPIs: total a receber, horas dadas, presenças, faltas, com variação contra o mês anterior. Gráfico de valor por dia. Últimas aulas do mês. Botão Fechar mês. Botão Exportar PDF (impressão).

Aulas dadas. Lista do mês com filtro por aluno e status. Criar, editar, excluir. Duração: 30 min, 1h, 1h30, 2h ou minutos livres. Status: presença, falta, cancelada, agendada.

Calendário. Grade mensal, dia atual destacado, cor por status, toque no dia abre a criação de aula naquele dia.

Cronograma. Agendamentos futuros. Botão "Converter em aula dada" cria a aula e marca o item como excluído.

Alunos e Turmas. VIP (individual) e de turma, ativo e inativo. Turma agrupa alunos.

Fechamentos. Lista dos meses fechados com os totais do snapshot.

Configurações. Nome, valor da hora, valor da falta, segurança (trocar senha, mostrar chave de recuperação mediante senha, sair deste aparelho), sincronização (estado e botão sincronizar agora), backup, importação do histórico, Diagnóstico.

Diagnóstico. Contagem local por tipo, arquivos pendentes, shas, último sync, último erro completo, identificador do build (`VITE_BUILD_ID`), botão "Reler a nuvem" (zera os shas guardados para forçar nova leitura e mescla; nunca apaga dado local).

R-50 Estados vazios sempre explicam o que fazer ("Nenhuma aula em setembro. Toque em + para lançar.").

R-51 Impressão: CSS `@media print` dedicado ao relatório mensal (cabeçalho, tabela de aulas, totais). Sem biblioteca.

---

## 14. Segurança e privacidade

R-52 O token do GitHub é a única credencial de rede. Fine-grained, limitado a UM repositório, permissão Contents: Read and write. Guardado em `ch:sync:v1` no aparelho e, cifrado, em `dados/acesso.txt` (seção 24). Nunca no código, nunca em log, nunca em mensagem de erro. Exibir mascarado na tela.

R-53 Não existe cópia manual de token entre aparelhos. O aparelho novo usa a senha do sistema (seção 24). O token só é digitado uma vez na vida, no assistente de primeira configuração.

R-54 Botão "Sair deste aparelho" em Configurações (seção 24.8).

R-55 Sem scripts de terceiros. Sem `dangerouslySetInnerHTML`. `index.html` com `<meta http-equiv="Content-Security-Policy">` restringindo `default-src 'self'`, `connect-src 'self' https://api.github.com https://raw.githubusercontent.com`, `img-src 'self' data:`, `style-src 'self' 'unsafe-inline'`.

R-56 Privacidade: os arquivos da branch `dados` são cifrados (seção 24). O repositório pode ser público sem expor nomes de alunos. O README explica o modelo de ameaça e a força mínima da senha.

R-57 O repositório do código nunca contém dados reais, `.env`, arquivos `.db` ou backups (F-08). O `.gitignore` bloqueia `*.db`, `.env*`, `backup*.txt`, `dados/`.

---

## 15. Build, CI e deploy

R-58 `vite.config.ts` com `base: './'` e rotas por HashRouter. Nenhum caminho absoluto de asset. Isso evita 404 e prefixo duplicado em qualquer nome de repositório (F-14).

R-59 Scripts: `typecheck` (`tsc --noEmit`), `lint`, `check` (`node scripts/check-rules.mjs`), `test` (`vitest run`), `build`, `verify` = typecheck, lint, check, test, build, nessa ordem, parando no primeiro erro. `test:e2e` roda o Playwright contra o `dist`.

R-60 O `tsconfig` tem `strict: true`, `noUncheckedIndexedAccess: true` e `exclude` para pastas que não são código do app. Nenhuma opção de build pode ignorar erros de tipo.

R-61 Workflow `deploy.yml`: dispara só em push para `main` e manualmente (`workflow_dispatch`); nunca na branch `dados`. Passos: checkout, Node 20, `npm ci`, `npm run verify`, instalar Chromium do Playwright, `npm run test:e2e`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`. Permissões: `contents: read`, `pages: write`, `id-token: write`. `VITE_BUILD_ID=${{ github.sha }}`. O deploy só roda se tudo passar.

R-62 Depois do build, um passo verifica que o `dist` não contém `ignoreBuildErrors`, tokens ou URLs absolutas com o nome do repositório.

### check-rules.mjs

R-63 O script varre `src/`, `e2e/`, `tests/` e a raiz, e reprova se encontrar:

| Padrão proibido | Motivo |
| --- | --- |
| `ignoreBuildErrors`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable` | F-01 |
| `new Date('`, `new Date("`, `new Date(\``, `Date.parse(` | F-09 |
| `: any`, `as any` | tipagem real |
| `.catch(() => {})`, `catch {}`, `catch (e) {}` com corpo vazio | F-06 |
| `localStorage` ou `sessionStorage` fora de `src/data/storage.ts` | P-09 |
| `fetch(` fora de `src/data/github.ts` e `src/data/legado.ts` | P-09 |
| `dangerouslySetInnerHTML` | R-55 |
| `crypto.subtle` fora de `src/data/cripto.ts` | R-73 |
| `Math.random` em `src/` | R-73 |
| log de token ou chave (`console.*` com `token` ou `chaveDados`) | R-79 |
| `toFixed(` em `src/domain/` | P-04 |
| `professor_id`, `usuarioId`, `assinatura`, `admin` em `src/` | D-03 |
| arquivos `.env*`, `*.db`, `backup*.txt` rastreados | P-08 |
| dependências `next`, `prisma`, `next-auth`, `@cloudflare/*` | seção 3 |
| dependência declarada e nunca importada | R-11 |

---

## 16. Testes obrigatórios

Unitários (vitest), todos antes de ligar o módulo à interface:

Cálculo: presença 60 min = 3500; 90 min = 5250; 120 min = 7000; turma 120 min = 7000; falta = 3500 contando 60 min; cancelada = 0; agendada = 0; valor da hora 3333 com 90 min = 5000.

Datas, executados com `TZ=America/Sao_Paulo` e com `TZ=UTC`: aula em `2026-10-31` pertence a `2026-10`; `diaDaSemana` correto; `hojeLocal` usa a data local; `somarMes('2026-12', 1) = '2027-01'`.

Mescla: união; o mais novo vence; lápide vence; registro só local não some; registro só remoto não some; idempotência; mesmo resultado independente da ordem.

Base64: round-trip de `João Açaí ñ 🙂`.

Migrações: arquivo com versão maior é recusado com erro.

Legado: importar o mesmo arquivo duas vezes dá a mesma contagem; duração e valor convertidos corretamente.

Sync com GitHub falso em memória: primeiro envio cria os arquivos; dois aparelhos editando registros diferentes do mesmo mês, ambos sincronizam, o resultado contém os dois sem perda; PUT com sha antigo recebe 409, o motor baixa, mescla e conclui; o pull nunca apaga registro local que o remoto não tem; duas chamadas simultâneas viram um ciclo por vez; erro de rede vira status `Erro` e mantém os pendentes; branch `dados` inexistente é criada.

E2E (Playwright), com a API do GitHub simulada por `page.route`, usando DOIS contextos de navegador como dois aparelhos:

E-01 Aparelho A cria aluno e aula; aparelho B sincroniza e vê os mesmos números do dashboard.
E-02 A edita a aula e B apaga outra, ambos sincronizam; os dois ficam iguais e coerentes.
E-03 B abre depois de dias com estado antigo e sincroniza; nada do que A fez some e nada do que B tinha some.
E-04 Recarregar a página mantém todos os dados.
E-05 Dia 31 às 23h30 permanece no mês correto.
E-06 Navegador novo digita a senha e vê os MESMOS números do dashboard, sem colar token.
E-07 Importar o histórico duas vezes mantém 27 aulas.

---

## 17. Protocolo de tarefa e evidência

Início de toda tarefa, em ordem:

1. Reescreva o pedido em até 3 linhas.
2. Liste as regras deste arquivo que se aplicam (códigos).
3. Liste os arquivos que vai criar ou alterar.
4. Faça grep por funções existentes (R-05).

Fim de toda tarefa, o relatório TEM de conter:

```
TAREFA: <nome>
REGRAS APLICADAS: <códigos>
ARQUIVOS ALTERADOS: <lista>
VERIFY: <saída COMPLETA de npm run verify, sem resumir>
E2E: <saída ou "não executado: motivo">
TESTES NOVOS: <nomes>
CRITÉRIOS DE ACEITE: <cada um com PASS ou FAIL>
PENDÊNCIAS E RISCOS: <o que ficou de fora>
```

R-64 PASS exige prova (saída de comando ou nome de teste). Item sem prova é FAIL.

R-65 Se o `verify` falhar, corrija na mesma tarefa. Não entregue com falha, não desligue regra, não enfraqueça teste para passar.

R-66 Atualize `CHANGELOG.md` com uma linha e `NOTAS.md` com as suposições feitas.

R-67 Pedido que contenha várias tarefas: execute apenas a primeira e liste as demais como "próximas".

R-68 Congelamento de contratos: assinaturas de `domain/` e nomes das chaves de armazenamento só mudam com entrada em `docs/decisoes.md` e migração.

---

## 18. Catálogo de falhas conhecidas (nunca repetir)

Estas falhas realmente ocorreram na versão anterior do sistema. Cada uma tem a regra que a impede.

| Código | O que aconteceu | Causa | Regra |
| --- | --- | --- | --- |
| F-01 | Build verde com botão de PDF quebrado | `ignoreBuildErrors: true` escondeu um import inexistente | P-07, R-60, R-63 |
| F-02 | Resíduos de template (Prisma, next-auth, Caddyfile, SDK do agente) | Scaffold padrão do agente | R-11, seção 3 |
| F-03 | Janelas diferentes mostrando números diferentes | Duas fontes de verdade (IndexedDB e nuvem) sincronizadas por cópia total | P-01, P-02, R-43 |
| F-04 | Dados importados invisíveis e login travado | Dois ids para o mesmo usuário e índice único de username | D-03 (sem usuários nem `professor_id`) |
| F-05 | Telas mostrando zero ou piscando | Vários pulls destrutivos simultâneos (sessão, layout, cada página) | R-42, R-43 |
| F-06 | Tela nunca atualizava depois do sync | Hook de recarregar virou função vazia; erros engolidos por `catch` vazio | R-08, R-31, P-06 |
| F-07 | 102 de 167 commits eram sync e cada um disparava deploy | Dados gravados na branch `main` | D-04, R-61 |
| F-08 | Nomes reais de alunos, `.env` e banco versionados em repositório público | `.gitignore` ignorado, arquivos adicionados à força | P-08, R-57 |
| F-09 | Risco de aula do dia 31 cair no mês errado | `new Date('AAAA-MM-DD')` interpreta como UTC | P-05, R-26, R-27 |
| F-10 | Centavos divergentes em somas | Dinheiro em float | P-04, R-21 |
| F-11 | Página prometia offline, criptografia e "2.500 professores" sem existir | Texto de marketing gerado sem checagem | P-10 |
| F-12 | Duas implementações do mesmo sync coexistindo | Agente criou versão nova sem remover a antiga | P-09, R-05 |
| F-13 | Agente executou 7 tarefas de uma vez e declarou sucesso | Sem protocolo de evidência | R-02, R-03, seção 17 |
| F-14 | `og:image` com o nome do repositório duplicado, ícone do manifest inválido | Caminhos absolutos com prefixo somado duas vezes | R-58, R-62 |
| F-15 | Dado velho exibido depois de sincronizar | Página lia o banco uma vez ao montar | P-01, R-30, R-31 |
| F-16 | 15 dependências instaladas sem uso | Agente adicionou bibliotecas "por precaução" | R-11 |
| F-17 | 11 erros de lint por estado derivado em `useEffect` | Padrão `setState` dentro de efeito | R-16 |
| F-18 | Parte do pedido ignorada (versão, identificador de build) sem aviso | Entrega parcial sem checklist | R-64, R-67 |
| F-19 | Segredo de API escrito no JavaScript público | Backend exposto ao navegador | P-08, R-52 |
| F-20 | Navegador ou janela nova abria vazio e parecia ter perdido os dados | Dados só no localStorage de quem os criou; sync exigia colar token em cada navegador; faltava fluxo de primeiro acesso | P-11, P-12, R-70, R-71, seção 24 |
| F-21 | Nomes de alunos legíveis por qualquer pessoa num repositório público | Dados em texto puro na branch de dados | R-56, seção 24.4 |

---

## 19. Proibições absolutas (lista de checagem rápida)

Antes de entregar, confirme que NADA disso existe no código:

1. Qualquer opção que ignore erro de tipo ou de lint.
2. `new Date('AAAA-MM-DD')`, `Date.parse` de data de negócio.
3. Dinheiro em float, `toFixed` no domínio.
4. `catch` vazio, função vazia fingindo funcionar.
5. `localStorage` fora de `data/storage.ts`; `fetch` fora de `data/github.ts` e `data/legado.ts`.
6. Operação que apague ou substitua o estado local inteiro.
7. Listener de `focus` para sincronizar; mais de um ciclo de sync simultâneo.
8. Hook ou evento "recarregar" manual.
9. Contas de usuário, login em servidor, `professor_id`, multi-usuário, admin, assinatura, pagamento, landing de vendas (a senha do sistema da seção 24 é permitida).
10. Dependência sem uso; versão inventada; `^` em `package.json`.
11. Segredo, token, dado real, `.env` ou `.db` no repositório do código.
12. Caminho absoluto de asset; service worker; PWA.
13. Afirmação de função inexistente em README ou tela.
14. Duas tarefas na mesma resposta; "feito" sem evidência.

---

## 20. Como expandir (receitas)

Receita para novo módulo de tela (exemplo: Relatório anual):

1. Regra de negócio pura em `domain/` com testes (ex.: `calcularResumoAno`).
2. Seletor em `store/seletores.ts`.
3. Pasta `features/relatorio-anual/` com a tela, usando só store e componentes.
4. Rota e item de menu em `app/`.
5. Se a tela precisar de dado novo: ver receita abaixo.
6. Teste unitário do domínio e um E2E curto. Linha no CHANGELOG.

Receita para novo campo ou nova coleção de dados:

1. Incrementar `versaoFormato`.
2. Escrever a migração em `domain/migracoes.ts` com teste (arquivo antigo abre com o campo padrão).
3. Atualizar os tipos em `domain/tipos.ts`.
4. Se for coleção nova: decidir o arquivo em `dados/`, e incluir na mescla e no mapa de pendentes.
5. Registrar a decisão em `docs/decisoes.md`.

Ideias de expansão já compatíveis com esta arquitetura, em ordem de custo: exportar CSV; tarifa por aluno; relatório anual; metas mensais; lembretes locais; apelido do aluno para privacidade em relatórios; filtro de busca global.

R-69 Expansão nunca introduz servidor, contas de usuário ou multiusuário. Isso pertence a outro produto.

---

## 21. Marcos de construção

M1: projeto Vite, `domain/` completo (cálculo, datas, mescla, migrações) com testes, `check-rules`, workflow e página mínima publicada. Critério: `verify` verde e o site abre no Pages.

M2: store, armazenamento local, CRUD de config, alunos, turmas, aulas e cronograma, tudo local.

M3: dashboard, calendário, fechamentos, impressão.

M4: cliente GitHub, motor de sync, acesso por senha e criptografia (seção 24), Diagnóstico, testes com GitHub falso e E2E de dois aparelhos.

M5: backup, importação do histórico, trocar senha e recuperação, sair deste aparelho.

M6: revisão final contra a seção 19, README, relatório com os 20 testes manuais.

Testes manuais finais: 1 aparelho novo mostra a tela de senha (ou o assistente de primeira configuração), nunca uma tela vazia; 2 criar aluno VIP e turma; 3 presença 1h = R$ 35,00; 4 presença 1h30 = R$ 52,50; 5 presença 2h = R$ 70,00; 6 falta = R$ 35,00; 7 cancelada e agendada = R$ 0,00; 8 aula dia 31 às 23h30 fica no mês certo; 9 dashboard bate com a soma da lista; 10 variação contra o mês anterior; 11 calendário destaca hoje e abre criar aula; 12 editar e excluir atualizam tudo sem recarregar; 13 fechar mês cria snapshot; 14 imprimir o PDF; 15 senha errada é recusada e a senha certa libera os mesmos dados em qualquer navegador; 16 sync válido envia os arquivos; 17 segundo aparelho com a mesma configuração mostra os MESMOS números; 18 editar nos dois e sincronizar mantém as duas edições; 19 importar o histórico traz 27 aulas e importar de novo não duplica; 20 recarregar mantém tudo.

---

## 22. Entrega para um novo professor (fork)

Esta seção descreve a operação do dono, não funcionalidade do app.

1. Fazer fork do repositório para a conta do professor (ou criar a partir do modelo).
2. Em `src/config/instancia.ts`, ajustar nome do professor e valores padrão (hora e falta) e fazer commit.
3. Em Settings, Pages, escolher "GitHub Actions" como fonte.
4. Aguardar o deploy e abrir o endereço `https://<usuario>.github.io/<repositorio>/`.
5. Abrir o app e executar a primeira configuração (seção 24.3): escolher a senha do sistema e colar o token do professor (criado por ele, limitado ao repositório). É a única vez que o token é digitado.

Nada no código muda entre professores além de `instancia.ts`. Não se cria lógica de múltiplos professores (D-03).

---

## 23. Definição de pronto (qualquer tarefa)

Pronta significa: `npm run verify` verde com saída colada; testes novos ou ajustados para o que mudou; `test:e2e` verde (ou justificativa explícita); nenhuma proibição da seção 19; CHANGELOG e NOTAS atualizados; relatório no formato da seção 17 com cada critério de aceite em PASS comprovado.

---

## 24. Acesso, primeiro uso e criptografia

Esta seção substitui qualquer comportamento de "modo local solto" e prevalece sobre as regras anteriores em caso de conflito.

### 24.1 Problema que resolve (F-20)

Um aparelho ou navegador novo abria vazio, porque os dados só existiam no localStorage de quem os criou e a sincronização exigia colar um token em cada navegador. Para o usuário, o sistema parecia perder os dados. Isso é erro de produto, não detalhe técnico, e nunca mais pode acontecer.

R-70 Nenhum dado fica preso num navegador. O localStorage é só cache. Todo aparelho novo chega ao mesmo estado digitando uma senha, sem colar token e sem configurar nada.

R-71 Nunca exibir um dashboard vazio como primeira tela de um aparelho novo. As únicas primeiras telas possíveis são: assistente de primeira configuração, tela de senha, ou o app já desbloqueado.

### 24.2 Máquina de estados de acesso

| Estado | Condição | Tela |
| --- | --- | --- |
| detectando | abrindo o app | splash curta |
| desbloqueado | o aparelho tem `chaveDados` e `token` em `ch:sync:v1` | app (cache primeiro, sync em segundo plano) |
| pedeSenha | sem material local e `dados/acesso.txt` existe | tela "Digite a senha do sistema" |
| primeiraConfiguracao | sem material local e a branch `dados` ou o `acesso.txt` não existe | assistente |
| erroRede | não foi possível consultar o GitHub | mensagem com botão "tentar de novo", sem apagar nada |

R-72 `data/acesso.ts` expõe uma função pura `decidirEstado(entrada)`, testada para cada linha da tabela. A interface só renderiza o estado devolvido.

### 24.3 Primeira configuração (assistente, uma tela por passo)

1. Senha do sistema: mínimo 10 caracteres, medidor de força, campo de confirmação, rejeitar as 100 senhas comuns de `src/data/senhas-comuns.ts`. Texto: "Esta senha protege os dados dos seus alunos. Sem ela e sem a chave de recuperação, não há como recuperar."
2. Token: instruções em 3 linhas e botão que abre a página de criação de token do GitHub. O app valida com `GET /repos/{repo}` exigindo `permissions.push === true` e mostra o nome do repositório confirmado.
3. Chave de recuperação: mostrar a chave de dados em grupos de 4 caracteres (base32), botão copiar, botão baixar `.txt` e checkbox obrigatório "guardei a chave".
4. Criação: criar a branch `dados` (R-39), gravar `dados/acesso.txt` e os arquivos iniciais cifrados. Se já existirem arquivos de dados em texto puro na branch (versão anterior), executar a migração 24.9.
5. Oferecer importar o histórico antigo (seção 12) e entrar no app.

### 24.4 Formato dos arquivos

Chave de dados K: 32 bytes aleatórios (`crypto.getRandomValues`), gerada uma única vez.

`dados/acesso.txt` (público e cifrado):

```
{ formato: 1,
  kdf: { alg: 'PBKDF2-SHA256', iteracoes: 600000, sal: <base64, 16 bytes> },
  iv: <base64, 12 bytes>,
  ct: <base64> }
```

O texto claro de `ct` é o JSON `{ chaveDados: <base64>, token: <string> }`, cifrado com AES-256-GCM usando a chave derivada da senha. AAD = `dados/acesso.txt`.

Arquivos de dados: `{ formato: 1, iv: <base64, 12 bytes>, ct: <base64> }`, AES-256-GCM com K, AAD = caminho do arquivo. O texto claro é o JSON descrito na seção 11.1.

R-73 Toda cifra e decifra passa por `data/cripto.ts`, o único arquivo que usa `crypto.subtle`. `Math.random` é proibido em `src/`.

R-74 O IV nunca é reaproveitado: novo IV aleatório a cada escrita, sempre.

R-75 Falha de autenticação do GCM (senha errada, arquivo adulterado, arquivo trocado de lugar) vira mensagem em português ("Senha incorreta" na tela de senha, "Arquivo corrompido ou alterado" nos dados) e nunca é ignorada. A mescla da seção 11 acontece sempre DEPOIS de decifrar; a decisão de enviar usa o texto claro, nunca o cifrado.

### 24.5 Leitura sem token

Para pedir a senha num aparelho novo, o app precisa ler `acesso.txt` sem token. Caminho: `GET /repos/{repo}/git/ref/heads/dados` sem autenticação (1 chamada) para obter o sha do commit, e depois `https://raw.githubusercontent.com/{repo}/{sha}/dados/acesso.txt`. A URL por sha nunca serve versão velha do cache. Depois de desbloqueado, o sync usa a API autenticada normalmente.

R-76 O limite sem autenticação é de 60 chamadas por hora por IP. Tratar 403 e 429 com mensagem clara e nova tentativa posterior; nunca entrar em loop.

R-77 Se o repositório for privado, a leitura anônima falha (404). Nesse caso o assistente pede o token ANTES da senha e segue o mesmo fluxo de cifragem. É um caminho alternativo, não o padrão.

### 24.6 Depois de desbloquear

Guardar `{ repo, branch, token, chaveDados }` em `ch:sync:v1`. Os arquivos são decifrados em memória e o estado decifrado vai para o cache `ch:estado:v1` (o aparelho é considerado confiável; "Sair deste aparelho" apaga tudo).

### 24.7 Trocar a senha e recuperar o acesso

Trocar a senha: pede a senha atual e a nova (mesmas regras do passo 1) e regrava apenas `acesso.txt`. Nenhum arquivo de dados é regravado, porque K não muda.

Recuperar com a chave de recuperação: aceita a chave de dados, valida decifrando um arquivo de dados, pede o token e uma nova senha, e regrava `acesso.txt`.

R-78 Senha esquecida e chave de recuperação perdida: não há recuperação. A tela de primeira configuração e o README dizem isso com clareza.

### 24.8 Sair deste aparelho

Botão em Configurações, com confirmação, apaga `ch:estado:v1`, `ch:sync:v1` e `ch:meta:v1`. Os dados na nuvem permanecem. O aparelho volta ao estado `pedeSenha`.

### 24.9 Migração de dados em texto puro

Se a branch `dados` já tiver arquivos sem os campos `iv` e `ct` (versão anterior), o assistente lê tudo, mescla com o local, cifra e regrava. Depois RECRIA a branch para apagar o histórico em texto puro: obtém o sha de `main`, executa `DELETE /git/refs/heads/dados`, cria a ref de novo e grava tudo cifrado em um único commit. Avisar o usuário de que cópias já feitas por terceiros (caches, forks) não podem ser apagadas.

### 24.10 Segurança honesta (o README deve repetir)

Modelo de ameaça: o repositório pode ser público e quem o lê vê só texto cifrado. A proteção depende da força da senha e do PBKDF2 com 600 mil iterações. O token fica dentro do `acesso.txt` cifrado, por isso deve ser fine-grained, restrito a UM repositório, com permissão Contents. Com senha fraca, um atacante pode tentar adivinhá-la offline. Recomendação opcional no README: ativar um ruleset em `main` exigindo pull request, para que um token vazado não consiga alterar o código do site.

R-79 Token e chave nunca aparecem em log, mensagem de erro, URL ou texto de tela, exceto a chave de recuperação mostrada uma vez no assistente e, depois, em Configurações mediante a senha.

### 24.11 Testes obrigatórios desta seção

Unitários: round-trip de cifra de arquivo; senha errada falha; arquivo adulterado em 1 byte falha; arquivo cifrado num caminho e lido em outro falha (AAD); IV diferente a cada cifra do mesmo texto; derivação determinística com o mesmo sal; `decidirEstado` para cada linha da tabela 24.2; força de senha rejeita as 100 comuns e as curtas; migração de texto puro para cifrado preserva todos os registros.

E2E (Playwright, API do GitHub simulada): E-08 contexto novo abre o site, digita a senha e vê os MESMOS números do dashboard sem colar token; E-09 primeira configuração completa em repositório vazio; E-10 trocar a senha e entrar em outro contexto com a nova; E-11 senha errada é recusada; E-12 sair deste aparelho e voltar com a senha.

### 24.12 Entrega ao cliente

Fork, ajuste de `instancia.ts`, ativar o Pages, abrir o site e fazer a primeira configuração com o professor (ou por ele): cerca de 5 minutos. A partir daí o professor usa em qualquer aparelho só com a senha.
