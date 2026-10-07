import type { Aula, Aluno, Turma, Fechamento, Professor, CronogramaItem } from '@/types';
import { gerarSalt, hashSenha, gerarId } from './crypto';
import { salvarProfessor, buscarProfessorPorUsername } from './db';

/**
 * Seed do Guilherme — cria APENAS o usuario.
 * ZERO alunos. ZERO aulas. ZERO turmas.
 * Tudo vem do sync (GitHub) ou é cadastrado pelo professor.
 */
export async function seedGuilherme(): Promise<void> {
  const existente = await buscarProfessorPorUsername('guilherme');
  if (existente) return;

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
    assinatura_status: 'lifetime',
    bloqueado: false,
    is_admin: true,
  };

  await salvarProfessor(professor);
}

export const CREDENCIAIS_DEMO = {
  username: 'guilherme',
  senha: 'professor123',
};

export async function resetarDadosProfessor(professor: Professor): Promise<void> {
  const { limparDadosProfessor } = await import('./db');
  await limparDadosProfessor(professor.id);
}
