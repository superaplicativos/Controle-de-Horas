import type { Aula, Aluno, Turma, Fechamento, Professor, CronogramaItem } from '@/types';
import { gerarSalt, hashSenha, gerarId } from './crypto';
import { salvarProfessor, salvarAula, salvarAluno, salvarTurma, salvarFechamento, salvarCronogramaItem, buscarProfessorPorUsername, listarAulasPorProfessor, listarAlunosPorProfessor } from './db';
import { calcularResumoMes, mesAtualRef } from './calculations';

// Gera YYYY-MM-DD para o dia informado, no mês/ano atuais
function dataNoMesAtual(dia: number): string {
  const mesRef = mesAtualRef(); // YYYY-MM
  return `${mesRef}-${dia.toString().padStart(2, '0')}`;
}

export async function seedGuilherme(): Promise<void> {
  const existente = await buscarProfessorPorUsername('guilherme');

  if (existente) {
    // Se já existe mas não tem aulas no mês atual, recria as aulas do mês atual
    const aulas = await listarAulasPorProfessor(existente.id);
    const mesAtual = mesAtualRef();
    const aulasMesAtual = aulas.filter((a) => a.mes_ref === mesAtual);
    if (aulasMesAtual.length === 0) {
      await criarAulasGuilherme(existente, mesAtual);
    }
    return;
  }

  const salt = gerarSalt();
  const senhaHash = await hashSenha('professor123', salt);

  const professor: Professor = {
    id: gerarId(),
    username: 'guilherme',
    senha_hash: senhaHash,
    salt,
    nome: 'Guilherme Miranda',
    valor_hora: 35,
    valor_falta: 35,
    criado_em: Date.now(),
  };

  await salvarProfessor(professor);

  // Turmas
  const turmaKids: Turma = {
    id: gerarId(),
    professor_id: professor.id,
    nome: 'TURMA KIDS',
    criado_em: Date.now(),
  };
  const turmaAdolescentes: Turma = {
    id: gerarId(),
    professor_id: professor.id,
    nome: 'TURMA ADOLESCENTES',
    criado_em: Date.now(),
  };
  await salvarTurma(turmaKids);
  await salvarTurma(turmaAdolescentes);

  // Alunos
  const alunoTurmaKids: Aluno = {
    id: gerarId(),
    professor_id: professor.id,
    nome: 'TURMA KIDS',
    tipo: 'turma',
    turma_id: turmaKids.id,
    ativo: true,
    criado_em: Date.now(),
  };
  const alunoTurmaAdolescentes: Aluno = {
    id: gerarId(),
    professor_id: professor.id,
    nome: 'TURMA ADOLESCENTES',
    tipo: 'turma',
    turma_id: turmaAdolescentes.id,
    ativo: true,
    criado_em: Date.now(),
  };
  const alunoJoelma: Aluno = {
    id: gerarId(),
    professor_id: professor.id,
    nome: 'Joelma',
    tipo: 'vip',
    turma_id: null,
    ativo: true,
    criado_em: Date.now(),
  };
  await salvarAluno(alunoTurmaKids);
  await salvarAluno(alunoTurmaAdolescentes);
  await salvarAluno(alunoJoelma);

  // Cria as aulas no mês atual
  await criarAulasGuilherme(professor, mesAtualRef(), {
    alunoTurmaKids,
    alunoTurmaAdolescentes,
    alunoJoelma,
  });
}

async function criarAulasGuilherme(
  professor: Professor,
  mesRef: string,
  alunos?: { alunoTurmaKids: Aluno; alunoTurmaAdolescentes: Aluno; alunoJoelma: Aluno }
): Promise<void> {
  let alunoTurmaKids: Aluno | undefined = alunos?.alunoTurmaKids;
  let alunoTurmaAdolescentes: Aluno | undefined = alunos?.alunoTurmaAdolescentes;
  let alunoJoelma: Aluno | undefined = alunos?.alunoJoelma;

  if (!alunoTurmaKids || !alunoTurmaAdolescentes || !alunoJoelma) {
    const alunosList = await listarAlunosPorProfessor(professor.id);
    alunoTurmaKids = alunosList.find((a) => a.nome === 'TURMA KIDS');
    alunoTurmaAdolescentes = alunosList.find((a) => a.nome === 'TURMA ADOLESCENTES');
    alunoJoelma = alunosList.find((a) => a.nome === 'Joelma');
  }

  if (!alunoTurmaKids || !alunoTurmaAdolescentes || !alunoJoelma) return;

  // Aulas do Guilherme — datas relativas ao mês atual:
  // 05 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 12 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 19 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 25 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 29 - KIDS 17-19h (presença)
  // ?? - Joelma 1h FALTA (sem data específica - coloquei dia 10 como placeholder)
  const datasTurmas: number[] = [5, 12, 19, 25];
  const conteudoKids = 'Aula regular - turma KIDS';
  const conteudoAdolescentes = 'Aula regular - turma Adolescentes';

  const aulas: Aula[] = [];
  for (const dia of datasTurmas) {
    const data = dataNoMesAtual(dia);
    aulas.push({
      id: gerarId(),
      professor_id: professor.id,
      aluno_id: alunoTurmaKids.id,
      aluno_nome: alunoTurmaKids.nome,
      aluno_tipo: 'turma',
      data,
      horario: '15:00',
      duracao: 2,
      status: 'presenca',
      conteudo: conteudoKids,
      valor: 70,
      mes_ref: mesRef,
      criado_em: Date.now(),
    });
    aulas.push({
      id: gerarId(),
      professor_id: professor.id,
      aluno_id: alunoTurmaAdolescentes.id,
      aluno_nome: alunoTurmaAdolescentes.nome,
      aluno_tipo: 'turma',
      data,
      horario: '17:00',
      duracao: 2,
      status: 'presenca',
      conteudo: conteudoAdolescentes,
      valor: 70,
      mes_ref: mesRef,
      criado_em: Date.now(),
    });
  }
  // Aula 29 - só KIDS, 17-19h
  aulas.push({
    id: gerarId(),
    professor_id: professor.id,
    aluno_id: alunoTurmaKids.id,
    aluno_nome: alunoTurmaKids.nome,
    aluno_tipo: 'turma',
    data: dataNoMesAtual(29),
    horario: '17:00',
    duracao: 2,
    status: 'presenca',
    conteudo: 'Aula regular - turma KIDS',
    valor: 70,
    mes_ref: mesRef,
    criado_em: Date.now(),
  });

  // Falta da Joelma (sem data específica - coloquei dia 10 como placeholder)
  aulas.push({
    id: gerarId(),
    professor_id: professor.id,
    aluno_id: alunoJoelma.id,
    aluno_nome: alunoJoelma.nome,
    aluno_tipo: 'vip',
    data: dataNoMesAtual(10),
    horario: '--:--',
    duracao: 1,
    status: 'falta',
    conteudo: 'Falta - VIP',
    valor: 35,
    mes_ref: mesRef,
    criado_em: Date.now(),
  });

  for (const aula of aulas) {
    await salvarAula(aula);
  }

  // Cria também o cronograma (planejamento) — exemplo: próximos sábados
  const cronogramaItens: CronogramaItem[] = [
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: 'TURMA KIDS',
      data: dataNoMesAtual(5),
      horario: '15:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma Adolescentes',
      aluno_nome: 'TURMA ADOLESCENTES',
      data: dataNoMesAtual(5),
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: 'TURMA KIDS',
      data: dataNoMesAtual(12),
      horario: '15:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma Adolescentes',
      aluno_nome: 'TURMA ADOLESCENTES',
      data: dataNoMesAtual(12),
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: 'TURMA KIDS',
      data: dataNoMesAtual(19),
      horario: '15:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma Adolescentes',
      aluno_nome: 'TURMA ADOLESCENTES',
      data: dataNoMesAtual(19),
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: 'TURMA KIDS',
      data: dataNoMesAtual(25),
      horario: '15:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma Adolescentes',
      aluno_nome: 'TURMA ADOLESCENTES',
      data: dataNoMesAtual(25),
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
    {
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: 'TURMA KIDS',
      data: dataNoMesAtual(29),
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    },
  ];

  for (const item of cronogramaItens) {
    await salvarCronogramaItem(item);
  }

  // Cria fechamento automático do mês atual se já passou
  const aulasMes = await listarAulasPorProfessor(professor.id);
  const aulasDoMes = aulasMes.filter((a) => a.mes_ref === mesRef);
  const resumo = calcularResumoMes(aulasDoMes);
  const fechamento: Fechamento = {
    id: gerarId(),
    professor_id: professor.id,
    mes: mesRef,
    total_aulas: resumo.totalAulas,
    total_horas: resumo.totalHoras,
    total_ganhos: resumo.totalGanhos,
    total_faltas: resumo.totalFaltas,
    total_presencas: resumo.totalPresencas,
    snapshot_json: JSON.stringify(aulasDoMes, null, 2),
    fechado_em: Date.now(),
  };
  // Só salva o fechamento se o mês for anterior ao atual (não fecha mês em andamento)
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  if (mesRef < mesAtual) {
    await salvarFechamento(fechamento);
  }
}
