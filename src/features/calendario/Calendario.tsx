import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { aulasVisiveis } from '../../store/seletores';
import { mesRefAtual, nomeMes, somarMes, diasDoMes, hojeLocal } from '../../domain/datas';
import type { StatusAula } from '../../domain/tipos';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COR: Record<StatusAula, string> = {
  presenca: 'bg-marca-100 text-marca-700 border-marca-300',
  falta: 'bg-red-100 text-red-700 border-red-300',
  cancelada: 'bg-slate-100 text-slate-500 border-slate-300',
  agendada: 'bg-amber-100 text-amber-700 border-amber-300',
};

export function Calendario() {
  const [mesRef, setMesRef] = useState(mesRefAtual());
  const aulas = useStore(aulasVisiveis);
  const navigate = useNavigate();

  const totalDias = diasDoMes(mesRef);
  const hoje = hojeLocal();

  const aulasPorData = new Map<string, typeof aulas>();
  for (const a of aulas) {
    if (a.mesRef === mesRef) {
      const arr = aulasPorData.get(a.data) ?? [];
      arr.push(a);
      aulasPorData.set(a.data, arr);
    }
  }

  const [anoStr, mesStr] = mesRef.split('-');
  const ano = parseInt(anoStr ?? '0', 10);
  const mes = parseInt(mesStr ?? '0', 10);
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();

  const celulas: (number | null)[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDias; dia++) celulas.push(dia);

  function dataISO(dia: number): string {
    return `${mesRef}-${dia.toString().padStart(2, '0')}`;
  }

  function abrirDia(dia: number) {
    const data = dataISO(dia);
    navigate('/aulas', { state: { dataPreSelecionada: data } });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMesRef(somarMes(mesRef, -1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Mês anterior">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{nomeMes(mesRef)}</h1>
        <button onClick={() => setMesRef(somarMes(mesRef, 1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Próximo mês">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            if (dia === null) return <div key={i} />;
            const data = dataISO(dia);
            const aulasDia = aulasPorData.get(data) ?? [];
            const ehHoje = data === hoje;
            return (
              <button
                key={i}
                onClick={() => abrirDia(dia)}
                className={`min-h-[60px] sm:min-h-[80px] rounded-lg border p-1 text-left hover:border-marca-400 hover:bg-marca-50 transition-colors ${
                  ehHoje ? 'border-marca-500 bg-marca-50' : 'border-slate-100'
                }`}
              >
                <div className={`text-xs font-medium ${ehHoje ? 'text-marca-700' : 'text-slate-600'}`}>
                  {dia}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {aulasDia.slice(0, 3).map((a) => (
                    <div key={a.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${STATUS_COR[a.status]}`}>
                      {a.alunoNome}
                    </div>
                  ))}
                  {aulasDia.length > 3 && (
                    <div className="text-[10px] text-slate-400">+{aulasDia.length - 3}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 text-xs">
        {(Object.keys(STATUS_COR) as StatusAula[]).map((s) => (
          <span key={s} className={`px-2 py-0.5 rounded border ${STATUS_COR[s]}`}>
            {s}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">Toque em um dia para lançar uma aula nele.</p>
    </div>
  );
}
