import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Professor, Aluno, Turma, Aula, Fechamento, Config, CronogramaItem } from '@/types';

interface ControleAulasDB extends DBSchema {
  professores: {
    key: string;
    value: Professor;
    indexes: { 'by-username': string };
  };
  alunos: {
    key: string;
    value: Aluno;
    indexes: { 'by-professor': string };
  };
  turmas: {
    key: string;
    value: Turma;
    indexes: { 'by-professor': string };
  };
  aulas: {
    key: string;
    value: Aula;
    indexes: { 'by-professor': string; 'by-mes': string; 'by-professor-mes': [string, string] };
  };
  fechamentos: {
    key: string;
    value: Fechamento;
    indexes: { 'by-professor': string; 'by-professor-mes': [string, string] };
  };
  cronograma: {
    key: string;
    value: CronogramaItem;
    indexes: { 'by-professor': string; 'by-data': string };
  };
  config: {
    key: string;
    value: Config & { id: string };
  };
}

let dbInstance: IDBPDatabase<ControleAulasDB> | null = null;

const DB_NAME = 'controle-aulas-db';
const DB_VERSION = 3;

export async function getDB(): Promise<IDBPDatabase<ControleAulasDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ControleAulasDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('professores')) {
          const profStore = db.createObjectStore('professores', { keyPath: 'id' });
          profStore.createIndex('by-username', 'username', { unique: true });
        }
        if (!db.objectStoreNames.contains('alunos')) {
          const alunoStore = db.createObjectStore('alunos', { keyPath: 'id' });
          alunoStore.createIndex('by-professor', 'professor_id');
        }
        if (!db.objectStoreNames.contains('turmas')) {
          const turmaStore = db.createObjectStore('turmas', { keyPath: 'id' });
          turmaStore.createIndex('by-professor', 'professor_id');
        }
        if (!db.objectStoreNames.contains('aulas')) {
          const aulaStore = db.createObjectStore('aulas', { keyPath: 'id' });
          aulaStore.createIndex('by-professor', 'professor_id');
          aulaStore.createIndex('by-mes', 'mes_ref');
          aulaStore.createIndex('by-professor-mes', ['professor_id', 'mes_ref']);
        }
        if (!db.objectStoreNames.contains('fechamentos')) {
          const fechStore = db.createObjectStore('fechamentos', { keyPath: 'id' });
          fechStore.createIndex('by-professor', 'professor_id');
          fechStore.createIndex('by-professor-mes', ['professor_id', 'mes']);
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('cronograma')) {
          const cronStore = db.createObjectStore('cronograma', { keyPath: 'id' });
          cronStore.createIndex('by-professor', 'professor_id');
          cronStore.createIndex('by-data', 'data');
        }
      }
      if (oldVersion < 3) {
        // V3: Adiciona campos de assinatura nos professores existentes
        // Não precisa criar nova store — só atualizar dados existentes
        // (feito automaticamente quando salvarProfessor for chamado)
      }
    },
  });

  return dbInstance;
}

// ============ PROFESSORES ============

export async function salvarProfessor(p: Professor): Promise<void> {
  const db = await getDB();
  await db.put('professores', p);
}

export async function buscarProfessorPorUsername(username: string): Promise<Professor | undefined> {
  const db = await getDB();
  return db.getFromIndex('professores', 'by-username', username.toLowerCase());
}

export async function listarProfessores(): Promise<Professor[]> {
  const db = await getDB();
  return db.getAll('professores');
}

// ============ ALUNOS ============

export async function salvarAluno(a: Aluno): Promise<void> {
  const db = await getDB();
  await db.put('alunos', a);
}

export async function listarAlunosPorProfessor(professorId: string): Promise<Aluno[]> {
  const db = await getDB();
  return db.getAllFromIndex('alunos', 'by-professor', professorId);
}

export async function deletarAluno(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('alunos', id);
}

// ============ TURMAS ============

export async function salvarTurma(t: Turma): Promise<void> {
  const db = await getDB();
  await db.put('turmas', t);
}

export async function listarTurmasPorProfessor(professorId: string): Promise<Turma[]> {
  const db = await getDB();
  return db.getAllFromIndex('turmas', 'by-professor', professorId);
}

export async function deletarTurma(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('turmas', id);
}

// ============ AULAS ============

export async function salvarAula(a: Aula): Promise<void> {
  const db = await getDB();
  await db.put('aulas', a);
}

export async function listarAulasPorProfessor(professorId: string): Promise<Aula[]> {
  const db = await getDB();
  return db.getAllFromIndex('aulas', 'by-professor', professorId);
}

export async function listarAulasPorMes(professorId: string, mesRef: string): Promise<Aula[]> {
  const db = await getDB();
  const todas = await db.getAllFromIndex('aulas', 'by-professor', professorId);
  return todas.filter((a) => a.mes_ref === mesRef);
}

export async function deletarAula(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('aulas', id);
}

// ============ FECHAMENTOS ============

export async function salvarFechamento(f: Fechamento): Promise<void> {
  const db = await getDB();
  await db.put('fechamentos', f);
}

export async function listarFechamentosPorProfessor(professorId: string): Promise<Fechamento[]> {
  const db = await getDB();
  return db.getAllFromIndex('fechamentos', 'by-professor', professorId);
}

export async function buscarFechamentoMes(professorId: string, mes: string): Promise<Fechamento | undefined> {
  const db = await getDB();
  return db.getFromIndex('fechamentos', 'by-professor-mes', [professorId, mes]);
}

// ============ CONFIG ============

const CONFIG_ID = 'global';

export async function getConfig(): Promise<Config | null> {
  const db = await getDB();
  const c = await db.get('config', CONFIG_ID);
  if (!c) return null;
  const { id: _id, ...rest } = c;
  void _id;
  return rest;
}

export async function salvarConfig(config: Config): Promise<void> {
  const db = await getDB();
  await db.put('config', { ...config, id: CONFIG_ID });
}

// ============ UTILITÁRIOS ============

export async function limparDadosProfessor(professorId: string): Promise<void> {
  const db = await getDB();
  const alunos = await db.getAllFromIndex('alunos', 'by-professor', professorId);
  const turmas = await db.getAllFromIndex('turmas', 'by-professor', professorId);
  const aulas = await db.getAllFromIndex('aulas', 'by-professor', professorId);
  const fechamentos = await db.getAllFromIndex('fechamentos', 'by-professor', professorId);
  const cronograma = await db.getAllFromIndex('cronograma', 'by-professor', professorId);

  const tx = db.transaction(['alunos', 'turmas', 'aulas', 'fechamentos', 'cronograma'], 'readwrite');
  await Promise.all([
    ...alunos.map((a) => tx.objectStore('alunos').delete(a.id)),
    ...turmas.map((t) => tx.objectStore('turmas').delete(t.id)),
    ...aulas.map((a) => tx.objectStore('aulas').delete(a.id)),
    ...fechamentos.map((f) => tx.objectStore('fechamentos').delete(f.id)),
    ...cronograma.map((c) => tx.objectStore('cronograma').delete(c.id)),
  ]);
  await tx.done;
}

export async function exportarDadosProfessor(professorId: string): Promise<{
  aulas: Aula[];
  alunos: Aluno[];
  turmas: Turma[];
  fechamentos: Fechamento[];
  cronograma: CronogramaItem[];
}> {
  const [aulas, alunos, turmas, fechamentos, cronograma] = await Promise.all([
    listarAulasPorProfessor(professorId),
    listarAlunosPorProfessor(professorId),
    listarTurmasPorProfessor(professorId),
    listarFechamentosPorProfessor(professorId),
    listarCronogramaPorProfessor(professorId),
  ]);
  return { aulas, alunos, turmas, fechamentos, cronograma };
}

// ============ CRONOGRAMA ============

export async function salvarCronogramaItem(item: CronogramaItem): Promise<void> {
  const db = await getDB();
  await db.put('cronograma', item);
}

export async function listarCronogramaPorProfessor(professorId: string): Promise<CronogramaItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('cronograma', 'by-professor', professorId);
}

export async function deletarCronogramaItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cronograma', id);
}
