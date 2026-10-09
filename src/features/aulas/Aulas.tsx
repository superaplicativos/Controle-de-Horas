import { useState, useMemo } from 'react';
import { useStore } from '../../store/store';
import { useStoreShallow, aulasVisiveis, mesesComAulas } from '../../store/seletores';
import { salvarAula, excluirAula } from '../../store/acoes';
import { calcularValorAulaCentavos, formatarCentavos } from '../../domain/calculos';
import { hojeLocal, mesRefAtual, nomeMes, diaDaSemana } from '../../domain/datas';
import type { TipoAula, StatusAula } from '../../domain/tipos';

interface FormState {
  data: string;
  horario: string;
  tipo: TipoAula;
  selecionado: string; // id do aluno ou turma
  duracaoMin: number;
  status: StatusAula;
  conteudo: string;
}

const VAZIO: FormState = {
  data: hojeLocal(),
  horario: '',
  tipo: 'vip',
  selecionado: '',
  duracaoMin: 60,
  status: 'presenca',
  conteudo: '',
};

export function Aulas() {
  const config = useStore((s) => s.config);
  const aulas = useStoreShallow(aulasVisiveis);
  const meses = useStoreShallow(mesesComAulas);
  const [mesFiltro, setMesFiltro] = useState(mesRefAtual());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');

  // Listas para o seletor
  const alunosVip = useStoreShallow((s) => s.alunos.filter((a) => !a.excluido && a.tipo === 'vip'));
  const turmas = useStoreShallow((s) => s.turmas.filter((t) => !t.excluido));

  const opcoes = form.tipo === 'vip' ? alunosVip : turmas;

  const valorPreview = useMemo(() => {
    return calcularValorAulaCentavos(form.status, form.duracaoMin, config.valorHoraCentavos, config.valorFaltaCentavos);
  }, [form.status, form.duracaoMin, config.valorHoraCentavos, config.valorFaltaCentavos]);

  const aulasMes = aulas.filter((a) => a.mesRef === mesFiltro).sort((a, b) => b.data.localeCompare(a.data) || (b.horario ?? '').localeCompare(a.horario ?? ''));

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...VAZIO, data: hojeLocal() });
    setErro('');
    setMostrarForm(true);
  }

  function abrirEditar(a: typeof aulasMes[number]) {
    setEditandoId(a.id);
    setForm({
      data: a.data,
      horario: a.horario ?? '',
      tipo: a.tipo,
      selecionado: a.alunoId ?? a.turmaId ?? '',
      duracaoMin: a.duracaoMin,
      status: a.status,
      conteudo: a.conteudo ?? '',
    });
    setErro('');
    setMostrarForm(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const selecionado = opcoes.find((o) => o.id === form.selecionado);
    if (!selecionado) { setErro('Selecione um aluno ou turma'); return; }
    try {
      salvarAula({
        id: editandoId ?? undefined,
        data: form.data,
        horario: form.horario || undefined,
        tipo: form.tipo,
        alunoId: form.tipo === 'vip' ? form.selecionado : undefined,
        turmaId: form.tipo === 'turma' ? form.selecionado : undefined,
        alunoNome: selecionado.nome,
        duracaoMin: form.duracaoMin,
        status: form.status,
        conteudo: form.conteudo || undefined,
      });
      setForm(VAZIO); setEditandoId(null); setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Aulas Dadas</h1>
        {!mostrarForm && <button onClick={abrirNovo} className="rounded-lg bg-marca-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-marca-700">+ Nova</button>}
      </div>

      {/* Filtro de mês */}
      {meses.length > 0 && (
        <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="mb-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          {meses.includes(mesRefAtual()) || <option value={mesRefAtual()}>{nomeMes(mesRefAtual())}</option>}
          {meses.map((m) => (<option key={m} value={m}>{nomeMes(m)}</option>))}
        </select>
      )}

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => { setForm({ ...form, tipo: e.target.value as TipoAula, selecionado: '' }); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="vip">VIP</option>
                <option value="turma">Turma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{form.tipo === 'vip' ? 'Aluno' : 'Turma'}</label>
              <select value={form.selecionado} onChange={(e) => setForm({ ...form, selecionado: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {opcoes.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duração</label>
              <select value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value={30}>30 min</option>
                <option value={60}>1h</option>
                <option value={90}>1h30</option>
                <option value={120}>2h</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusAula })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="presenca">Presença</option>
                <option value="falta">Falta</option>
                <option value="cancelada">Cancelada</option>
                <option value="agendada">Agendada</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Conteúdo</label>
            <input value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Opcional" />
          </div>
          <div className="rounded-lg bg-marca-50 px-3 py-2 text-sm">
            <span className="text-slate-600">Valor: </span>
            <span className="font-bold text-marca-700">{formatarCentavos(valorPreview)}</span>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700">Salvar</button>
            <button type="button" onClick={() => { setForm(VAZIO); setEditandoId(null); setMostrarForm(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {aulasMes.length === 0 && !mostrarForm ? (
        <p className="text-sm text-slate-400 text-center py-8">Nenhuma aula em {nomeMes(mesFiltro)}. Toque em + Nova para lançar.</p>
      ) : (
        <div className="space-y-1">
          {aulasMes.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-700">
                  {a.data.slice(8, 10)}/{a.data.slice(5, 7)} <span className="text-xs text-slate-400">{diaDaSemana(a.data)}</span> · {a.alunoNome}
                </div>
                <div className="text-xs text-slate-400">
                  {a.status} · {a.duracaoMin}min{a.conteudo ? ' · ' + a.conteudo : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-700">{formatarCentavos(a.valorCentavos)}</span>
                <button onClick={() => abrirEditar(a)} className="text-xs text-marca-600 hover:underline">Editar</button>
                <button onClick={() => { if (confirm('Excluir esta aula?')) excluirAula(a.id); }} className="text-xs text-red-500 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
