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
    // Professor já existe — não cria aulas automaticas
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

  // NAO cria aulas automaticas — o professor cadastra as suas
  // (dados reais vem do sync com o GitHub)
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

  // Aulas já existentes (pra não duplicar)
  const aulasExistentes = await listarAulasPorProfessor(professor.id);
  const existeAula = (data: string, alunoId: string) =>
    aulasExistentes.some((a) => a.data === data && a.aluno_id === alunoId);

  // Cronograma já existente
  const { listarCronogramaPorProfessor, salvarCronogramaItem } = await import('./db');
  const cronogramaExistente = await listarCronogramaPorProfessor(professor.id);
  const existeCronograma = (data: string, alunoNome: string, horario: string) =>
    cronogramaExistente.some((c) => c.data === data && c.aluno_nome === alunoNome && c.horario === horario);

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

  const aulasParaCriar: Aula[] = [];
  const cronogramaParaCriar: CronogramaItem[] = [];

  for (const dia of datasTurmas) {
    const data = dataNoMesAtual(dia);
    // KIDS 15:00
    if (!existeAula(data, alunoTurmaKids.id)) {
      aulasParaCriar.push({
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
    }
    // ADOLESCENTES 17:00
    if (!existeAula(data, alunoTurmaAdolescentes.id)) {
      aulasParaCriar.push({
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
    // Cronograma KIDS
    if (!existeCronograma(data, alunoTurmaKids.nome, '15:00')) {
      cronogramaParaCriar.push({
        id: gerarId(),
        professor_id: professor.id,
        titulo: 'Aula Turma KIDS',
        aluno_nome: alunoTurmaKids.nome,
        data,
        horario: '15:00',
        duracao: 2,
        observacao: 'Aula regular',
        criado_em: Date.now(),
      });
    }
    // Cronograma ADOLESCENTES
    if (!existeCronograma(data, alunoTurmaAdolescentes.nome, '17:00')) {
      cronogramaParaCriar.push({
        id: gerarId(),
        professor_id: professor.id,
        titulo: 'Aula Turma Adolescentes',
        aluno_nome: alunoTurmaAdolescentes.nome,
        data,
        horario: '17:00',
        duracao: 2,
        observacao: 'Aula regular',
        criado_em: Date.now(),
      });
    }
  }

  // Aula 29 - só KIDS, 17-19h
  const data29 = dataNoMesAtual(29);
  if (!existeAula(data29, alunoTurmaKids.id)) {
    aulasParaCriar.push({
      id: gerarId(),
      professor_id: professor.id,
      aluno_id: alunoTurmaKids.id,
      aluno_nome: alunoTurmaKids.nome,
      aluno_tipo: 'turma',
      data: data29,
      horario: '17:00',
      duracao: 2,
      status: 'presenca',
      conteudo: 'Aula regular - turma KIDS',
      valor: 70,
      mes_ref: mesRef,
      criado_em: Date.now(),
    });
  }
  if (!existeCronograma(data29, alunoTurmaKids.nome, '17:00')) {
    cronogramaParaCriar.push({
      id: gerarId(),
      professor_id: professor.id,
      titulo: 'Aula Turma KIDS',
      aluno_nome: alunoTurmaKids.nome,
      data: data29,
      horario: '17:00',
      duracao: 2,
      observacao: 'Aula regular',
      criado_em: Date.now(),
    });
  }

  // Falta da Joelma (dia 10 placeholder)
  const dataJoelma = dataNoMesAtual(10);
  if (!existeAula(dataJoelma, alunoJoelma.id)) {
    aulasParaCriar.push({
      id: gerarId(),
      professor_id: professor.id,
      aluno_id: alunoJoelma.id,
      aluno_nome: alunoJoelma.nome,
      aluno_tipo: 'vip',
      data: dataJoelma,
      horario: '--:--',
      duracao: 1,
      status: 'falta',
      conteudo: 'Falta - VIP',
      valor: 35,
      mes_ref: mesRef,
      criado_em: Date.now(),
    });
  }

  // Salva tudo
  for (const aula of aulasParaCriar) {
    await salvarAula(aula);
  }
  for (const item of cronogramaParaCriar) {
    await salvarCronogramaItem(item);
  }

  // Cria fechamento automático do mês se já passou (mês anterior ao atual)
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
  if (mesRef < mesAtual) {
    const { buscarFechamentoMes } = await import('./db');
    const fechamentoExistente = await buscarFechamentoMes(professor.id, mesRef);
    if (!fechamentoExistente) {
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
      await salvarFechamento(fechamento);
    }
  }
}

// Função pública pra forçar reset completo dos dados do professor
export async function resetarDadosProfessor(professor: Professor): Promise<void> {
  const { limparDadosProfessor } = await import('./db');
  await limparDadosProfessor(professor.id);
  await criarAulasGuilherme(professor, mesAtualRef());
}
