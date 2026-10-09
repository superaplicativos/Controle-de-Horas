# 20 testes manuais finais (R-90)

Rode num aparelho limpo (janela anônima) antes e depois de cada entrega. Anote data, versão do deploy e resultado.

## Preparação

1. Abra `https://superaplicativos.github.io/Controle-de-Horas/` em janela anônima.
2. Se for testar sync entre aparelhos, abra uma segunda janela anônima com o mesmo endereço.

## Testes

### T1 — Abrir sem token mostra modo local
**Passo:** Abra o app sem configurar sync.
**Esperado:** Dashboard abre. Em Configurações, status mostra "Somente neste aparelho".

### T2 — Criar aluno VIP e turma
**Passo:** Vá em Turmas, crie "KIDS 1". Vá em Alunos, crie "João" (VIP, ativo) e "Maria" (Turma, apontando para KIDS 1).
**Esperado:** Os dois aparecem nas listas.

### T3 — Presença 1h = R$ 35,00
**Passo:** Vá em Aulas, crie aula para João, data hoje, duração 1h, status presença.
**Esperado:** Valor mostra R$ 35,00 (com valor/hora padrão R$ 35).

### T4 — Presença 1h30 = R$ 52,50
**Passo:** Crie aula para João, duração 1h30, status presença.
**Esperado:** Valor mostra R$ 52,50.

### T5 — Presença 2h = R$ 70,00
**Passo:** Crie aula para João, duração 2h, status presença.
**Esperado:** Valor mostra R$ 70,00.

### T6 — Falta = R$ 35,00
**Passo:** Crie aula para João, duração 1h, status falta.
**Esperado:** Valor mostra R$ 35,00 (independe da duração).

### T7 — Cancelada e agendada = R$ 0,00
**Passo:** Crie duas aulas: uma cancelada e uma agendada.
**Esperado:** Ambas mostram R$ 0,00.

### T8 — Aula dia 31 às 23h30 fica no mês certo
**Passo:** Crie aula para João, data 31/10/2026, horário 23:30, duração 1h, status presença.
**Esperado:** Aula aparece em outubro (não em novembro). No dashboard, mês de outubro mostra a aula.

### T9 — Dashboard bate com a soma da lista
**Passo:** Crie 3 aulas no mês atual. Vá no dashboard.
**Esperado:** Total a receber = soma dos valores das 3 aulas. Horas dadas = soma das durações (presenças) + 1h por falta.

### T10 — Variação contra o mês anterior
**Passo:** Crie aulas em dois meses consecutivos. No dashboard, navegue para o segundo mês.
**Esperado:** KPI "A receber" mostra seta ↑ ou ↓ com a variação percentual contra o mês anterior.

### T11 — Calendário destaca hoje e abre criar aula
**Passo:** Vá no Calendário.
**Esperado:** Dia atual destacado em verde. Toque num dia → vai para tela de aulas com a data pré-preenchida.

### T12 — Editar e excluir atualizam tudo sem recarregar
**Passo:** Edite uma aula existente (mude duração). Exclua outra.
**Esperado:** Dashboard e lista atualizam imediatamente, sem recarregar a página. Aula excluída some da lista (vira lápide internamente).

### T13 — Fechar mês cria snapshot
**Passo:** No dashboard, clique em "Fechar mês".
**Esperado:** Aparece selo "Mês fechado em DD/MM/AAAA". Vá em Fechamentos: o mês aparece na lista com os totais.

### T14 — Imprimir o PDF
**Passo:** No dashboard, clique em "Imprimir / PDF".
**Esperado:** Abre a janela de impressão do navegador. O layout mostra só a tabela de aulas e totais (sem navegação).

### T15 — Repositório público mostra aviso
**Passo:** Configure sync apontando para um repositório público.
**Esperado:** Aviso âmbar "Este repositório é público" com checkbox "Entendi, continuar".

### T16 — Sync válido envia os arquivos
**Passo:** Configure sync com token válido. Crie uma aula. Aguarde 3 segundos.
**Esperado:** Status muda para "Sincronizando..." e depois "Sincronizado em HH:MM". No GitHub, a branch `dados` contém os arquivos.

### T17 — Segundo aparelho com a mesma configuração mostra os MESMOS números
**Passo:** Configure sync no aparelho A. Crie aulas. No aparelho B, cole a configuração e sincronize.
**Esperado:** Aparelho B mostra os mesmos números no dashboard (mesmo total de aulas, mesmo valor).

### T18 — Editar nos dois e sincronizar mantém as duas edições
**Passo:** Aparelho A edita aula X. Aparelho B edita aula Y (diferente). Ambos sincronizam.
**Esperado:** Ambos ficam com as duas edições (X e Y atualizadas).

### T19 — Importar o histórico traz os dados e importar de novo não duplica
**Passo:** Vá em Configurações → "Importar histórico antigo". Aguarde. Importe de novo.
**Esperado:** Primeira importação traz os registros (ex: 27 aulas do backup legado). Segunda importação não duplica — contagem permanece a mesma.

### T20 — Recarregar mantém tudo
**Passo:** Crie alunos, aulas, cronograma. Recarregue a página (F5).
**Esperado:** Todos os dados continuam lá. Nada se perde.

## Resultado

Se todos os 20 testes passarem, o sistema está pronto para uso. Se algum falhar, anote qual e o que apareceu.
