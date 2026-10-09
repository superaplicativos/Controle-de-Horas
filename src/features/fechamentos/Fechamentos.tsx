import { useStore } from '../../store/store';
import { aulasVisiveis } from '../../store/seletores';
import { reabrirMes } from '../../store/acoes';
import { formatarCentavos, formatarMinutos } from '../../domain/calculos';
import { nomeMes } from '../../domain/datas';
import { divergeDoSnapshot } from '../../domain/fechamentos';
import type { Fechamento } from '../../domain/tipos';

export function Fechamentos() {
  const fechamentos = useStore((s) => s.fechamentos.filter((f) => !f.excluido));
  const aulas = useStore(aulasVisiveis);

  const ordenados = [...fechamentos].sort((a, b) => b.mesRef.localeCompare(a.mesRef));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Fechamentos</h1>

      {ordenados.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          Nenhum mês fechado ainda. Vá no Dashboard e toque em "Fechar mês" para criar um snapshot imutável.
        </p>
      ) : (
        <div className="space-y-3">
          {ordenados.map((f: Fechamento) => {
            const aulasMes = aulas.filter((a) => a.mesRef === f.mesRef);
            const diverge = divergeDoSnapshot(f, aulasMes);
            return (
              <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-700">{nomeMes(f.mesRef)}</h2>
                  <span className="text-xs text-slate-400">
                    Fechado em {new Date(f.fechadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-xs text-slate-400">Aulas</div>
                    <div className="font-semibold text-slate-700">{f.totalAulas}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Horas</div>
                    <div className="font-semibold text-slate-700">{formatarMinutos(f.totalMinutos)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="font-semibold text-marca-700">{formatarCentavos(f.totalCentavos)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Faltas</div>
                    <div className="font-semibold text-red-500">{f.totalFaltas}</div>
                  </div>
                </div>

                {diverge && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-2">
                    ⚠ Totais atuais divergem do snapshot. Aulas foram alteradas após o fechamento.
                  </div>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Reabrir ${f.mesRef}? Isso permite editar as aulas novamente e remove o snapshot.`)) {
                      reabrirMes(f.mesRef);
                    }
                  }}
                  className="text-xs text-amber-600 hover:underline"
                >
                  Reabrir mês
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
