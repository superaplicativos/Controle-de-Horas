import { useState } from 'react';
import { useStore } from '../../store/store';
import { turmasVisiveis } from '../../store/seletores';
import { salvarTurma, excluirTurma } from '../../store/acoes';

export function Turmas() {
  const turmas = useStore(turmasVisiveis);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');

  function abrirNovo() { setEditandoId(null); setNome(''); setErro(''); setMostrarForm(true); }
  function abrirEditar(t: typeof turmas[number]) { setEditandoId(t.id); setNome(t.nome); setErro(''); setMostrarForm(true); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      salvarTurma({ id: editandoId ?? undefined, nome });
      setNome(''); setEditandoId(null); setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Turmas</h1>
        {!mostrarForm && <button onClick={abrirNovo} className="rounded-lg bg-marca-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-marca-700">+ Nova</button>}
      </div>

      {mostrarForm && (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome da turma</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none" placeholder="Ex: KIDS 1" autoFocus />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700">Salvar</button>
            <button type="button" onClick={() => { setNome(''); setEditandoId(null); setMostrarForm(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {turmas.length === 0 && !mostrarForm ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhuma turma cadastrada. Toque em + Nova para começar.</p>
      ) : (
        <div className="space-y-1">
          {turmas.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-sm font-medium text-slate-700">{t.nome}</span>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(t)} className="text-xs text-marca-600 hover:underline px-2">Editar</button>
                <button onClick={() => { if (confirm(`Excluir ${t.nome}?`)) excluirTurma(t.id); }} className="text-xs text-red-500 hover:underline px-2">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
