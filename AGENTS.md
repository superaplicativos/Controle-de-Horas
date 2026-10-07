# REGRAS FIXAS DO PROJETO

Leia este arquivo antes de iniciar qualquer tarefa.

1. O site é export estático (`output: export`) no GitHub Pages. Não crie rotas de API do Next, não use Prisma nem next-auth.
2. Edite só os arquivos citados na tarefa, apenas os trechos necessários. Nunca reescreva um arquivo inteiro.
3. Não altere chaves, segredos, `WORKER_URL` nem `API_SECRET`.
4. Não altere `next.config.ts` nem o workflow de deploy, salvo se a tarefa pedir.
5. Uma tarefa por vez. Ao terminar, rode `npm run verify` e cole a saída completa.
6. Se algo do pedido não for possível, diga o motivo. Não invente solução paralela.

## Caminho dourado (precisa funcionar de ponta a ponta)

1. Cria a conta.
2. Cadastra aluno VIP e turma.
3. Lança aula (presença, falta, cancelada, agendada) com valor calculado sozinho.
4. Vê o dashboard com horas e valor do mês.
5. Vê o calendário colorido.
6. Fecha o mês.
7. Entra em outro aparelho e vê exatamente os mesmos dados.

## O que está congelado (não mexer)

- Cadastro e login que funcionam em qualquer aparelho
- Isolamento garantido entre vários professores
- Alunos, turmas, aulas e cálculo automático
- Painel admin além de listar e liberar acesso
- Calendário, dashboard e fechamento mensal
- Sync estável entre dois aparelhos
- PDF do mês e backup TXT
- Tela de assinar com liberação manual
