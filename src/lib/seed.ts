import { gerarSalt, hashSenha, gerarId } from './crypto';
import { salvarProfessor, buscarProfessorPorUsername } from './db';
import type { Professor } from '@/types';

export async function seedGuilherme(): Promise<void> {
  const existente = await buscarProfessorPorUsername('guilherme');
  if (existente) return;
  const salt = gerarSalt();
  const senhaHash = await hashSenha('professor123', salt);
  await salvarProfessor({
    id: gerarId(), username: 'guilherme', senha_hash: senhaHash, salt,
    nome: 'Guilherme Miranda', valor_hora: 35, valor_falta: 35,
    criado_em: Date.now(), assinatura_status: 'lifetime', bloqueado: false, is_admin: true,
  });
}

export async function resetarDadosProfessor(professor: Professor): Promise<void> {
  const { limparDadosProfessor } = await import('./db');
  await limparDadosProfessor(professor.id);
}
