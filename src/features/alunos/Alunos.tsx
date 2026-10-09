import { useState } from 'react';
import { useStore } from '../../store/store';
import { alunosVisiveis, turmasVisiveis } from '../../store/seletores';
import { salvarAluno, excluirAluno } from '../../store/acoes';
import type { TipoAula } from '../../domain/tipos';

interface FormState {
  nome: string;
  tipo: TipoAula;
  turmaId: string;
  ativo: boolean;
}

const VAZIO: FormState = { nome: '', tipo: 'vip', turmaId: '', ativo: true };

export function Alunos() {
  const alunos = useStore(alunosVisiveis);
  const turmas = useStore(turmasVisiveis);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  function abrirNovo() {
    setEditandoId(null);
    setForm(VAZIO);
    setErro('');
    setMostrarForm(true);
  }

  function abrirEditar(aluno: typeof alunos[number]) {
    setEditandoId(aluno.id);
    setForm({ nome: aluno.nome, tipo: aluno.tipo, turmaId: aluno.turmaId ?? '', ativo: aluno.ativo });
    setErro('');
    setMostrarForm(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      salvarAluno({
        id: editandoId ?? undefined,
        nome: form.nome,
        tipo: form.tipo,
        turmaId: form.tipo === 'turma' ? form.turmaId || undefined : undefined,
        ativo: form.ativo,
      });
      setForm(VAZIO);
      setEditandoId(null);
      setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Alunos</h1>
        {!mostrarForm && (
          <button onClick={abrirNovo} className="rounded-lg bg-marca-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-marca-700">+ Novo</button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none" placeholder="Nome do aluno" autoFocus />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoAula })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="vip">VIP (individual)</option>
                <option value="turma">Turma</option>
              </select>
            </div>
            {form.tipo === 'turma' && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Turma</label>
                <select value={form.turmaId} onChange={(e) => setForm({ ...form, turmaId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
                </select>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Ativo
          </label>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700">Salvar</button>
            <button type="button" onClick={() => { setForm(VAZIO); setEditandoId(null); setMostrarForm(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {alunos.length === 0 && !mostrarForm ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhum aluno cadastrado. Toque em + Novo para começar.</p>
      ) : (
        <div className="space-y-1">
          {alunos.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-slate-700">{a.nome}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {a.tipo === 'vip' ? 'VIP' : `Turma${a.turmaId ? ' · ' + (turmas.find((t) => t.id === a.turmaId)?.nome ?? '') : ''}`}
                  {!a.ativo && ' · inativo'}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(a)} className="text-xs text-marca-600 hover:underline px-2">Editar</button>
                <button onClick={() => { if (confirm(`Excluir ${a.nome}?`)) excluirAluno(a.id); }} className="text-xs text-red-500 hover:underline px-2">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
