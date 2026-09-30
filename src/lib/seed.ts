import type { Aula, Aluno, Turma, Fechamento, Professor } from '@/types';
import { gerarSalt, hashSenha, gerarId } from './crypto';
import { salvarProfessor, salvarAula, salvarAluno, salvarTurma, salvarFechamento, buscarProfessorPorUsername, listarAulasPorProfessor } from './db';
import { calcularResumoMes } from './calculations';

export async function seedGuilherme(): Promise<void> {
  // Verifica se já existe
  const existente = await buscarProfessorPorUsername('guilherme');
  if (existente) return; // já cadastrado

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

  // Alunos (turmas e VIP)
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

  // Aulas de setembro 2025
  // Guilherme informou:
  // 05/09 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 12/09 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 19/09 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 25/09 - KIDS 15-17h, ADOLESCENTES 17-19h (presença)
  // 29/09 - KIDS 17-19h (presença) [última aula só turma KIDS]
  // ??/09 - Joelma 1h FALTA
  // Total: 9 presenças turma x 2h, 1 falta Joelma (1h)
  const datasTurmas: string[] = ['2025-09-05', '2025-09-12', '2025-09-19', '2025-09-25'];
  const conteudoKids = 'Aula regular - turma KIDS';
  const conteudoAdolescentes = 'Aula regular - turma Adolescentes';

  const aulas: Aula[] = [];
  for (const data of datasTurmas) {
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
      mes_ref: '2025-09',
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
      mes_ref: '2025-09',
      criado_em: Date.now(),
    });
  }
  // Aula 29/09 - só KIDS, 17-19h
  aulas.push({
    id: gerarId(),
    professor_id: professor.id,
    aluno_id: alunoTurmaKids.id,
    aluno_nome: alunoTurmaKids.nome,
    aluno_tipo: 'turma',
    data: '2025-09-29',
    horario: '17:00',
    duracao: 2,
    status: 'presenca',
    conteudo: 'Aula regular - turma KIDS',
    valor: 70,
    mes_ref: '2025-09',
    criado_em: Date.now(),
  });

  // Falta da Joelma (sem data específica - vou colocar 10/09 como placeholder)
  aulas.push({
    id: gerarId(),
    professor_id: professor.id,
    aluno_id: alunoJoelma.id,
    aluno_nome: alunoJoelma.nome,
    aluno_tipo: 'vip',
    data: '2025-09-10', // data estimada
    horario: '--:--',
    duracao: 1,
    status: 'falta',
    conteudo: 'Falta - VIP',
    valor: 35,
    mes_ref: '2025-09',
    criado_em: Date.now(),
  });

  for (const aula of aulas) {
    await salvarAula(aula);
  }

  // Cria fechamento de setembro automaticamente (snapshot imutável)
  const aulasSetembro = await listarAulasPorProfessor(professor.id);
  const resumo = calcularResumoMes(aulasSetembro.filter((a) => a.mes_ref === '2025-09'));
  const fechamento: Fechamento = {
    id: gerarId(),
    professor_id: professor.id,
    mes: '2025-09',
    total_aulas: resumo.totalAulas,
    total_horas: resumo.totalHoras,
    total_ganhos: resumo.totalGanhos,
    total_faltas: resumo.totalFaltas,
    total_presencas: resumo.totalPresencas,
    snapshot_json: JSON.stringify(aulasSetembro.filter((a) => a.mes_ref === '2025-09'), null, 2),
    fechado_em: Date.now(),
  };
  await salvarFechamento(fechamento);
}

export const CREDENCIAIS_DEMO = {
  username: 'guilherme',
  senha: 'professor123',
};
