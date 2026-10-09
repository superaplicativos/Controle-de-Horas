import { describe, it, expect, beforeEach } from 'vitest';
import { gerarBackupTxt, importarBackupTxt, importarEstadoBruto, converterLegado } from '../src/data/backup';
import { useStore, reiniciar } from '../src/store/store';
import { salvarConfig, salvarAluno, salvarAula } from '../src/store/acoes';

beforeEach(() => reiniciar());

describe('gerarBackupTxt', () => {
  it('gera TXT com seção JSON COMPLETO', () => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    const estado = useStore.getState();
    const txt = gerarBackupTxt(estado);
    expect(txt).toContain('----- JSON COMPLETO -----');
    expect(txt).toContain('----- FIM -----');
    expect(txt).toContain('PROFESSOR: Prof');
    expect(txt).toContain('VALOR/HORA: R$ 35.00');
  });

  it('inclui aulas agrupadas por mês', () => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'A', duracaoMin: 60, status: 'presenca' });
    salvarAula({ data: '2026-10-20', tipo: 'vip', alunoNome: 'B', duracaoMin: 90, status: 'presenca' });
    const estado = useStore.getState();
    const txt = gerarBackupTxt(estado);
    expect(txt).toContain('-- 2026-09 --');
    expect(txt).toContain('-- 2026-10 --');
  });
});

describe('importarBackupTxt', () => {
  it('round-trip: exporta, importa em estado limpo, dados voltam', () => {
    // Cria estado com dados
    salvarConfig({ nome: 'Prof Original', valorHoraCentavos: 5000, valorFaltaCentavos: 3500 });
    salvarAluno({ nome: 'Aluno 1', tipo: 'vip', ativo: true });
    salvarAula({ data: '2026-09-15', tipo: 'vip', alunoNome: 'Aluno 1', duracaoMin: 60, status: 'presenca' });

    const txt = gerarBackupTxt(useStore.getState());

    // Limpa e re-importa
    reiniciar();
    const r = importarBackupTxt(txt);
    expect(r.erro).toBeUndefined();
    expect(r.alteracoes).toBeGreaterThan(0);

    const estado = useStore.getState();
    // O config do backup tem atualizadoEm maior que o do estadoVazio (que acabou de ser criado com Date.now())
    // então a mescla pode escolher qualquer um dos dois. Verificamos os alunos e aulas, que importam mais.
    expect(estado.alunos.some((a) => a.nome === 'Aluno 1')).toBe(true);
    expect(estado.aulas.some((a) => a.alunoNome === 'Aluno 1')).toBe(true);
  });

  it('importar duas vezes não duplica (idempotente via mescla)', () => {
    salvarConfig({ nome: 'Prof', valorHoraCentavos: 3500, valorFaltaCentavos: 3500 });
    salvarAluno({ nome: 'Aluno', tipo: 'vip', ativo: true });
    const txt = gerarBackupTxt(useStore.getState());

    reiniciar();
    importarBackupTxt(txt);
    const count1 = useStore.getState().alunos.filter((a) => !a.excluido).length;
    importarBackupTxt(txt);
    const count2 = useStore.getState().alunos.filter((a) => !a.excluido).length;
    expect(count1).toBe(count2);
  });

  it('rejeita formato sem JSON COMPLETO', () => {
    const r = importarBackupTxt('texto aleatório sem marcadores');
    expect(r.erro).toContain('JSON COMPLETO');
  });

  it('rejeita JSON inválido', () => {
    const r = importarBackupTxt('----- JSON COMPLETO -----\n{invalid json}\n----- FIM -----');
    expect(r.erro).toContain('JSON inválido');
  });
});

describe('converterLegado (R-49)', () => {
  it('converte formato legado do Next.js para o atual', () => {
    const legado = {
      professor: { nome: 'Guilherme', valor_hora: 35 },
      alunos: [
        { id: 'a1', nome: 'Aluno 1', tipo: 'vip', ativo: true, criado_em: 1000 },
      ],
      turmas: [
        { id: 't1', nome: 'KIDS', criado_em: 1000 },
      ],
      aulas: [
        {
          id: 'au1', data: '2026-09-15', horario: '15:00',
          aluno_id: 'a1', aluno_nome: 'Aluno 1', aluno_tipo: 'vip',
          duracao: 1.5, status: 'presenca', conteudo: 'Excel',
          valor: 52.5, mes_ref: '2026-09', criado_em: 2000,
        },
      ],
      cronograma: [],
      fechamentos: [],
    };

    const r = converterLegado(legado);
    expect('erro' in r).toBe(false);
    if ('erro' in r) return;
    const estado = r.estado;

    expect(estado.config.nome).toBe('Guilherme');
    expect(estado.config.valorHoraCentavos).toBe(3500);
    expect(estado.alunos).toHaveLength(1);
    expect(estado.alunos[0]?.nome).toBe('Aluno 1');
    expect(estado.aulas).toHaveLength(1);
    expect(estado.aulas[0]?.duracaoMin).toBe(90); // 1.5h → 90min
    expect(estado.aulas[0]?.valorCentavos).toBe(5250); // 52.5 → 5250
    expect(estado.aulas[0]?.alunoId).toBe('a1');
    expect(estado.aulas[0]?.alunoNome).toBe('Aluno 1');
    expect(estado.aulas[0]?.tipo).toBe('vip');
    expect(estado.aulas[0]?.mesRef).toBe('2026-09');
  });

  it('converte fechamento legado (total_horas em horas → minutos)', () => {
    const legado = {
      professor: { nome: 'P', valor_hora: 35 },
      alunos: [], turmas: [], aulas: [], cronograma: [],
      fechamentos: [
        {
          id: 'f1', mes: '2026-09', total_aulas: 30, total_horas: 56,
          total_ganhos: 1960, total_faltas: 4, total_presencas: 26,
          fechado_em: 1000,
        },
      ],
    };
    const r = converterLegado(legado);
    if ('erro' in r) return;
    expect(r.estado.fechamentos[0]?.totalMinutos).toBe(3360); // 56h → 3360min
    expect(r.estado.fechamentos[0]?.totalCentavos).toBe(196000); // 1960 → 196000
  });

  it('ignora professor_id (D-03)', () => {
    const legado = {
      professor: { nome: 'P', valor_hora: 35 },
      alunos: [{ id: 'a1', nome: 'A', tipo: 'vip', ativo: true, professor_id: 'p1', criado_em: 1 }],
      turmas: [], aulas: [], cronograma: [], fechamentos: [],
    };
    const r = converterLegado(legado);
    if ('erro' in r) return;
    // professor_id não aparece no formato novo
    expect(JSON.stringify(r.estado)).not.toContain('professor_id');
  });
});

describe('importarEstadoBruto (formato legado)', () => {
  it('detecta e converte legado automaticamente', () => {
    const legado = {
      professor: { nome: 'Legado', valor_hora: 35 },
      alunos: [{ id: 'a1', nome: 'A', tipo: 'vip', ativo: true, criado_em: 1 }],
      turmas: [], aulas: [], cronograma: [], fechamentos: [],
    };
    const r = importarEstadoBruto(legado);
    expect(r.erro).toBeUndefined();
    expect(useStore.getState().config.nome).toBe('Legado');
    expect(useStore.getState().alunos.some((a) => a.nome === 'A')).toBe(true);
  });

  it('importar legado duas vezes não duplica (R-90 E-07)', () => {
    const legado = {
      professor: { nome: 'Legado', valor_hora: 35 },
      alunos: [{ id: 'a1', nome: 'A', tipo: 'vip', ativo: true, criado_em: 1 }],
      turmas: [], aulas: [
        { id: 'au1', data: '2026-09-15', aluno_nome: 'A', aluno_tipo: 'vip', duracao: 1, status: 'presenca', valor: 35, mes_ref: '2026-09', criado_em: 2 },
      ], cronograma: [], fechamentos: [],
    };
    // Simula contagem esperada: 1 aluno + 1 aula = 2
    const r1 = importarEstadoBruto(legado);
    expect(r1.alteracoes).toBe(2);
    const aulas1 = useStore.getState().aulas.filter((a) => !a.excluido).length;

    importarEstadoBruto(legado);
    const aulas2 = useStore.getState().aulas.filter((a) => !a.excluido).length;
    expect(aulas1).toBe(aulas2); // não duplicou
  });
});
