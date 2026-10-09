import { useState } from 'react';
import { useStore } from '../../store/store';
import { salvarConfig } from '../../store/acoes';
import { formatarCentavos } from '../../domain/calculos';

export function Configuracoes() {
  const config = useStore((s) => s.config);
  const pendentes = useStore((s) => s.meta.pendentes);
  const ultimoSync = useStore((s) => s.meta.ultimoSync);

  const [nome, setNome] = useState(config.nome);
  const [valorHora, setValorHora] = useState(String((config.valorHoraCentavos / 100).toFixed(2)));
  const [valorFalta, setValorFalta] = useState(String((config.valorFaltaCentavos / 100).toFixed(2)));
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setSalvo(false);
    try {
      const vh = Math.round(parseFloat(valorHora.replace(',', '.')) * 100);
      const vf = Math.round(parseFloat(valorFalta.replace(',', '.')) * 100);
      if (isNaN(vh) || isNaN(vf)) throw new Error('Valores inválidos');
      salvarConfig({ nome, valorHoraCentavos: vh, valorFaltaCentavos: vf });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Configurações</h1>

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Dados do professor</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor da hora (R$)</label>
            <input value={valorHora} onChange={(e) => setValorHora(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" step="0.01" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor da falta (R$)</label>
            <input value={valorFalta} onChange={(e) => setValorFalta(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" step="0.01" min="0" />
          </div>
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {salvo && <p className="text-sm text-marca-600">Salvo!</p>}
        <button type="submit" className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700">Salvar</button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Sincronização</h2>
        <p className="text-xs text-slate-500">Status: {ultimoSync ? `Sincronizado em ${new Date(ultimoSync).toLocaleString('pt-BR')}` : 'Somente neste aparelho'}</p>
        <p className="text-xs text-slate-500">Arquivos pendentes: {pendentes.length}</p>
        {pendentes.length > 0 && (
          <ul className="text-xs text-slate-400 list-disc list-inside">
            {pendentes.map((p) => (<li key={p}>{p}</li>))}
          </ul>
        )}
        <p className="text-xs text-slate-400 mt-2">A configuração do sync (token GitHub) chega no M4.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Resumo</h2>
        <div className="text-xs text-slate-500 space-y-1">
          <p>Valor da hora: <strong>{formatarCentavos(config.valorHoraCentavos)}</strong></p>
          <p>Valor da falta: <strong>{formatarCentavos(config.valorFaltaCentavos)}</strong></p>
        </div>
      </div>
    </div>
  );
}
