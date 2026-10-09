// Backup e importação em TXT. (R-48)
//
// Exportar: baixa arquivo TXT com o estado completo (JSON legível).
// Importar: MESCLA com o estado atual, nunca substitui. (R-48, P-02)

import type { Estado, Aluno, Turma, Aula, CronogramaItem, Fechamento, Config } from '../domain/tipos';
import { mesclarRegistros, mesclarConfig } from '../domain/mescla';
import { useStore } from '../store/store';
import { salvarEstado, salvarMeta } from './storage';
import { CAMINHO_CADASTROS, CAMINHO_CONFIG, CAMINHO_CRONOGRAMA, CAMINHO_FECHAMENTOS, caminhoAulaMes } from './sync';

/** R-48: gera o conteúdo TXT do backup. */
export function gerarBackupTxt(estado: Estado): string {
  const partes: string[] = [];
  partes.push('========================================');
  partes.push(' CONTROLE DE HORAS - BACKUP');
  partes.push(` Exportado em: ${new Date().toISOString()}`);
  partes.push(` Versão do formato: ${estado.versaoFormato}`);
  partes.push('========================================');
  partes.push('');
  partes.push(`PROFESSOR: ${estado.config.nome}`);
  partes.push(`VALOR/HORA: R$ ${(estado.config.valorHoraCentavos / 100).toFixed(2)}`);
  partes.push(`VALOR/FALTA: R$ ${(estado.config.valorFaltaCentavos / 100).toFixed(2)}`);
  partes.push('');

  partes.push('----- ALUNOS -----');
  for (const a of estado.alunos.filter((a) => !a.excluido)) {
    partes.push(`${a.id} | ${a.nome} | ${a.tipo} | ${a.ativo ? 'ativo' : 'inativo'}${a.turmaId ? ' | ' + a.turmaId : ''}`);
  }
  partes.push('');

  partes.push('----- TURMAS -----');
  for (const t of estado.turmas.filter((t) => !t.excluido)) {
    partes.push(`${t.id} | ${t.nome}`);
  }
  partes.push('');

  const aulasPorMes = new Map<string, Aula[]>();
  for (const a of estado.aulas.filter((a) => !a.excluido)) {
    const arr = aulasPorMes.get(a.mesRef) ?? [];
    arr.push(a);
    aulasPorMes.set(a.mesRef, arr);
  }
  partes.push('----- AULAS DADAS -----');
  for (const [mesRef, aulas] of Array.from(aulasPorMes.entries()).sort()) {
    partes.push(`-- ${mesRef} --`);
    for (const a of aulas) {
      partes.push(`${a.data} | ${a.alunoNome.padEnd(20).slice(0, 20)} | ${a.horario ?? '--'} | ${a.duracaoMin}min | ${a.status.padEnd(10)} | R$ ${(a.valorCentavos / 100).toFixed(2)} | ${a.conteudo ?? ''}`);
    }
  }
  partes.push('');

  partes.push('----- CRONOGRAMA -----');
  for (const c of estado.cronograma.filter((c) => !c.excluido)) {
    partes.push(`${c.data} | ${c.titulo}${c.alunoNome ? ' | ' + c.alunoNome : ''}${c.horario ? ' | ' + c.horario : ''}`);
  }
  partes.push('');

  partes.push('----- FECHAMENTOS -----');
  for (const f of estado.fechamentos.filter((f) => !f.excluido)) {
    partes.push(`${f.mesRef}: ${f.totalAulas} aulas | ${f.totalMinutos}min | R$ ${(f.totalCentavos / 100).toFixed(2)} | ${f.totalFaltas} faltas`);
  }
  partes.push('');

  partes.push('----- JSON COMPLETO -----');
  partes.push(JSON.stringify(estado, null, 2));
  partes.push('----- FIM -----');

  return partes.join('\n');
}

/** R-48: faz download do arquivo TXT no navegador. */
export function baixarBackup(estado: Estado): void {
  const conteudo = gerarBackupTxt(estado);
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * R-48: importa um backup TXT, MESCLANDO com o estado atual.
 * Nunca substitui. (P-02, R-43)
 *
 * Aceita dois formatos:
 * 1. JSON completo entre "----- JSON COMPLETO -----" e "----- FIM -----" (formato atual)
 * 2. JSON legado entre "----- JSON COMPLETO -----" e "----- FIM -----" (formato antigo do Next.js)
 */
export function importarBackupTxt(conteudo: string): { alteracoes: number; erro?: string } {
  const match = conteudo.match(/----- JSON COMPLETO -----\s*\n([\s\S]*?)\n----- FIM -----/);
  if (!match?.[1]) {
    return { alteracoes: 0, erro: 'Formato inválido: não encontrei a seção JSON COMPLETO' };
  }

  let obj: unknown;
  try {
    obj = JSON.parse(match[1].trim());
  } catch (e) {
    return { alteracoes: 0, erro: 'JSON inválido no backup: ' + (e instanceof Error ? e.message : '?') };
  }

  return importarEstadoBruto(obj);
}

/**
 * Importa um objeto estado bruto (formato atual OU legado), mesclando.
 * Usado tanto pelo backup TXT quanto pela importação do legado. (R-49)
 */
export function importarEstadoBruto(obj: unknown): { alteracoes: number; erro?: string } {
  if (!obj || typeof obj !== 'object') {
    return { alteracoes: 0, erro: 'Conteúdo não é um objeto' };
  }

  const bruto = obj as Record<string, unknown>;

  const ehLegado = !('versaoFormato' in bruto) && ('alunos' in bruto || 'aulas' in bruto);

  let estadoImportado: Estado;
  if (ehLegado) {
    const resultado = converterLegado(bruto);
    if ('erro' in resultado) return { alteracoes: 0, erro: resultado.erro };
    estadoImportado = resultado.estado;
  } else {
    estadoImportado = bruto as unknown as Estado;
    if (!estadoImportado.versaoFormato || typeof estadoImportado.versaoFormato !== 'number') {
      return { alteracoes: 0, erro: 'versaoFormato ausente ou inválido' };
    }
  }

  const atual = useStore.getState();
  const { meta: _m, erroCorrupcao: _e, ...estadoAtual } = atual;
  void _m;
  void _e;

  const configMesclada = mesclarConfig(estadoAtual.config, estadoImportado.config);
  const alunosMesclados = mesclarRegistros(estadoAtual.alunos, estadoImportado.alunos);
  const turmasMescladas = mesclarRegistros(estadoAtual.turmas, estadoImportado.turmas);
  const aulasMescladas = mesclarRegistros(estadoAtual.aulas, estadoImportado.aulas);
  const cronogramaMesclado = mesclarRegistros(estadoAtual.cronograma, estadoImportado.cronograma);
  const fechamentosMesclados = mesclarRegistros(estadoAtual.fechamentos, estadoImportado.fechamentos);

  const novoEstado: Estado = {
    versaoFormato: estadoAtual.versaoFormato,
    config: configMesclada,
    alunos: alunosMesclados,
    turmas: turmasMescladas,
    aulas: aulasMescladas,
    cronograma: cronogramaMesclado,
    fechamentos: fechamentosMesclados,
  };

  useStore.setState({ ...novoEstado, meta: atual.meta, erroCorrupcao: null });
  salvarEstado(novoEstado);

  // Marca todos os arquivos como pendentes
  const pendentes = new Set(atual.meta.pendentes);
  pendentes.add(CAMINHO_CONFIG);
  pendentes.add(CAMINHO_CADASTROS);
  pendentes.add(CAMINHO_CRONOGRAMA);
  pendentes.add(CAMINHO_FECHAMENTOS);
  for (const a of aulasMescladas) {
    pendentes.add(caminhoAulaMes(a.mesRef));
  }
  const novaMeta = { ...atual.meta, pendentes: Array.from(pendentes) };
  salvarMeta(novaMeta);
  useStore.setState({ meta: novaMeta });

  const alteracoes =
    estadoImportado.alunos.length + estadoImportado.turmas.length +
    estadoImportado.aulas.length + estadoImportado.cronograma.length +
    estadoImportado.fechamentos.length;

  return { alteracoes };
}

/**
 * R-49: converte o formato legado (do sistema Next.js antigo) para o formato atual.
 *
 * Mapeamento:
 * - aula.duracao (horas decimais) → duracaoMin = Math.round(duracao * 60)
 * - aula.valor (reais) → valorCentavos = Math.round(valor * 100)
 * - aula.aluno_id → alunoId
 * - aula.aluno_nome → alunoNome
 * - aula.aluno_tipo → tipo
 * - aula.mes_ref → mesRef
 * - aula.turma_id → turmaId
 * - aula.criado_em → atualizadoEm (quando existir)
 * - Ignora campo de professor do formato antigo
 * - Mantém ids antigos para idempotência
 */
export function converterLegado(bruto: Record<string, unknown>): { estado: Estado } | { erro: string } {
  try {
    const alunosLegado = (bruto.alunos as Array<Record<string, unknown>> | undefined) ?? [];
    const turmasLegado = (bruto.turmas as Array<Record<string, unknown>> | undefined) ?? [];
    const aulasLegado = (bruto.aulas as Array<Record<string, unknown>> | undefined) ?? [];
    const cronogramaLegado = (bruto.cronograma as Array<Record<string, unknown>> | undefined) ?? [];
    const fechamentosLegado = (bruto.fechamentos as Array<Record<string, unknown>> | undefined) ?? [];
    const professorLegado = (bruto.professor as Record<string, unknown> | undefined);

    const config: Config = {
      nome: (professorLegado?.nome as string) ?? 'Professor',
      valorHoraCentavos: Math.round(((professorLegado?.valor_hora as number) ?? 35) * 100),
      valorFaltaCentavos: 3500,
      atualizadoEm: Date.now(),
    };

    const alunos: Aluno[] = alunosLegado.map((a) => ({
      id: String(a.id ?? crypto.randomUUID()),
      atualizadoEm: (a.criado_em as number) ?? Date.now(),
      nome: String(a.nome ?? ''),
      tipo: (a.tipo === 'turma' ? 'turma' : 'vip') as Aluno['tipo'],
      turmaId: a.turma_id ? String(a.turma_id) : undefined,
      ativo: a.ativo !== false && a.ativo !== 0,
    }));

    const turmas: Turma[] = turmasLegado.map((t) => ({
      id: String(t.id ?? crypto.randomUUID()),
      atualizadoEm: (t.criado_em as number) ?? Date.now(),
      nome: String(t.nome ?? ''),
    }));

    const aulas: Aula[] = aulasLegado.map((a) => {
      const duracaoHoras = (a.duracao as number) ?? 1;
      const valorReais = (a.valor as number) ?? 0;
      const data = String(a.data ?? '');
      return {
        id: String(a.id ?? crypto.randomUUID()),
        atualizadoEm: (a.criado_em as number) ?? Date.now(),
        data,
        horario: a.horario ? String(a.horario) : undefined,
        tipo: (a.aluno_tipo === 'turma' ? 'turma' : 'vip') as Aula['tipo'],
        alunoId: a.aluno_id ? String(a.aluno_id) : undefined,
        turmaId: a.turma_id ? String(a.turma_id) : undefined,
        alunoNome: String(a.aluno_nome ?? ''),
        duracaoMin: Math.round(duracaoHoras * 60),
        status: (a.status as Aula['status']) ?? 'presenca',
        conteudo: a.conteudo ? String(a.conteudo) : undefined,
        valorCentavos: Math.round(valorReais * 100),
        mesRef: (a.mes_ref as string) ?? data.slice(0, 7),
      };
    });

    const cronograma: CronogramaItem[] = cronogramaLegado.map((c) => ({
      id: String(c.id ?? crypto.randomUUID()),
      atualizadoEm: (c.criado_em as number) ?? Date.now(),
      data: String(c.data ?? ''),
      horario: c.horario ? String(c.horario) : undefined,
      titulo: String(c.titulo ?? ''),
      alunoNome: c.aluno_nome ? String(c.aluno_nome) : undefined,
      duracaoMin: c.duracao ? Math.round((c.duracao as number) * 60) : undefined,
      observacao: c.observacao ? String(c.observacao) : undefined,
    }));

    const fechamentos: Fechamento[] = fechamentosLegado.map((f) => ({
      id: String(f.id ?? crypto.randomUUID()),
      atualizadoEm: (f.fechado_em as number) ?? Date.now(),
      mesRef: String(f.mes ?? ''),
      totalAulas: (f.total_aulas as number) ?? 0,
      totalMinutos: Math.round(((f.total_horas as number) ?? 0) * 60),
      totalCentavos: Math.round(((f.total_ganhos as number) ?? 0) * 100),
      totalFaltas: (f.total_faltas as number) ?? 0,
      totalPresencas: (f.total_presencas as number) ?? 0,
      fechadoEm: (f.fechado_em as number) ?? Date.now(),
    }));

    return {
      estado: {
        versaoFormato: 1,
        config,
        alunos,
        turmas,
        aulas,
        cronograma,
        fechamentos,
      },
    };
  } catch (e) {
    return { erro: 'Erro ao converter legado: ' + (e instanceof Error ? e.message : '?') };
  }
}
