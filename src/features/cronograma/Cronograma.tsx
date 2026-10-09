import { useState } from 'react';
import { useStoreShallow, cronogramaVisivel } from '../../store/seletores';
import { salvarCronogramaItem, excluirCronogramaItem } from '../../store/acoes';
import { hojeLocal, diaDaSemana } from '../../domain/datas';

interface FormState {
  data: string;
  horario: string;
  titulo: string;
  alunoNome: string;
  duracaoMin: number;
  observacao: string;
}

const VAZIO: FormState = {
  data: hojeLocal(),
  horario: '',
  titulo: '',
  alunoNome: '',
  duracaoMin: 60,
  observacao: '',
};

export function Cronograma() {
  const itens = useStoreShallow(cronogramaVisivel);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');

  const ordenados = [...itens].sort((a, b) => a.data.localeCompare(b.data) || (a.horario ?? '').localeCompare(b.horario ?? ''));

  function abrirNovo() { setEditandoId(null); setForm({ ...VAZIO, data: hojeLocal() }); setErro(''); setMostrarForm(true); }
  function abrirEditar(c: typeof itens[number]) {
    setEditandoId(c.id);
    setForm({ data: c.data, horario: c.horario ?? '', titulo: c.titulo, alunoNome: c.alunoNome ?? '', duracaoMin: c.duracaoMin ?? 60, observacao: c.observacao ?? '' });
    setErro(''); setMostrarForm(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      salvarCronogramaItem({
        id: editandoId ?? undefined,
        data: form.data,
        horario: form.horario || undefined,
        titulo: form.titulo,
        alunoNome: form.alunoNome || undefined,
        duracaoMin: form.duracaoMin || undefined,
        observacao: form.observacao || undefined,
      });
      setForm(VAZIO); setEditandoId(null); setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Cronograma</h1>
        {!mostrarForm && <button onClick={abrirNovo} className="rounded-lg bg-marca-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-marca-700">+ Novo</button>}
      </div>

      {mostrarForm && (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Horário</label>
              <input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Título</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Ex: Aula de revisão" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aluno (opcional)</label>
              <input value={form.alunoNome} onChange={(e) => setForm({ ...form, alunoNome: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duração (min)</label>
              <input type="number" value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observação</label>
            <input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700">Salvar</button>
            <button type="button" onClick={() => { setForm(VAZIO); setEditandoId(null); setMostrarForm(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {ordenados.length === 0 && !mostrarForm ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhum item no cronograma. Toque em + Novo para planejar.</p>
      ) : (
        <div className="space-y-1">
          {ordenados.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-700">
                  {c.data.slice(8, 10)}/{c.data.slice(5, 7)} <span className="text-xs text-slate-400">{diaDaSemana(c.data)}</span> · {c.titulo}
                </div>
                <div className="text-xs text-slate-400">
                  {c.horario && c.horario + ' · '}{c.alunoNome && c.alunoNome + ' · '}{c.duracaoMin && c.duracaoMin + 'min'}
                  {c.observacao && ' · ' + c.observacao}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => abrirEditar(c)} className="text-xs text-marca-600 hover:underline px-2">Editar</button>
                <button onClick={() => { if (confirm('Excluir este item?')) excluirCronogramaItem(c.id); }} className="text-xs text-red-500 hover:underline px-2">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
