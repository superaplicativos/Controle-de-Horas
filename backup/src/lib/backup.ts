/**
 * Backup manual em .txt — formato legível + JSON completo no rodapé.
 * Usado pela tela de Configurações (exportar/importar).
 */

import type { BackupTXT } from '@/types';

export function gerarBackupTXT(backup: BackupTXT): string {
  const linhas: string[] = [];
  linhas.push('========================================');
  linhas.push(' CONTROLE DE AULAS - BACKUP');
  linhas.push(` Exportado em: ${backup.exportado_em}`);
  linhas.push(` Versão: ${backup.versao}`);
  linhas.push('========================================');
  linhas.push('');
  linhas.push(`PROFESSOR: ${backup.professor.nome} (@${backup.professor.username})`);
  linhas.push(`VALOR/HORA: R$ ${backup.professor.valor_hora.toFixed(2)}`);
  linhas.push('');

  linhas.push('----- ALUNOS -----');
  for (const a of backup.alunos) {
    linhas.push(`${a.id} | ${a.nome} | ${a.tipo} | ${a.ativo ? 'ativo' : 'inativo'}`);
  }
  linhas.push('');

  linhas.push('----- TURMAS -----');
  for (const t of backup.turmas) {
    linhas.push(`${t.id} | ${t.nome}`);
  }
  linhas.push('');

  linhas.push('----- AULAS DADAS -----');
  for (const a of backup.aulas) {
    linhas.push(
      `${a.data} | ${(a.aluno_nome || '').padEnd(20).slice(0, 20)} | ${a.horario} | ${a.duracao}h | ${(a.status || '').padEnd(10)} | R$ ${a.valor.toFixed(2)} | ${a.conteudo || ''}`
    );
  }
  linhas.push('');

  linhas.push('----- CRONOGRAMA (PLANEJAMENTO) -----');
  for (const c of (backup.cronograma || [])) {
    linhas.push(`${c.data} | ${(c.aluno_nome || '').padEnd(20).slice(0, 20)} | ${c.horario} | ${c.duracao}h | ${c.titulo} | ${c.observacao || ''}`);
  }
  linhas.push('');

  linhas.push('----- FECHAMENTOS -----');
  for (const f of backup.fechamentos) {
    linhas.push(`${f.mes}: ${f.total_aulas} aulas | ${f.total_horas}h | R$ ${f.total_ganhos.toFixed(2)} | ${f.total_faltas} faltas`);
  }
  linhas.push('');

  linhas.push('----- JSON COMPLETO -----');
  linhas.push(JSON.stringify(backup, null, 2));
  linhas.push('----- FIM -----');

  return linhas.join('\n');
}

export function parseBackupTXT(conteudo: string): BackupTXT | null {
  const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as BackupTXT;
  } catch {
    return null;
  }
}
