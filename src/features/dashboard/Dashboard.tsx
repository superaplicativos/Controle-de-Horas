import { useState } from 'react';
import { useStore } from '../../store/store';
import { aulasVisiveis } from '../../store/seletores';
import { fecharMes, reabrirMes } from '../../store/acoes';
import { calcularResumoMes, formatarCentavos, formatarMinutos, variacaoPercentual } from '../../domain/calculos';
import { mesRefAtual, nomeMes, somarMes, diaDaSemana } from '../../domain/datas';
import { mesFechado, divergeDoSnapshot } from '../../domain/fechamentos';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export function Dashboard() {
  const [mesRef, setMesRef] = useState(mesRefAtual());
  const aulas = useStore(aulasVisiveis);
  const fechamentos = useStore((s) => s.fechamentos);

  const aulasMes = aulas.filter((a) => a.mesRef === mesRef);
  const resumo = calcularResumoMes(aulasMes);
  const mesAnterior = somarMes(mesRef, -1);
  const aulasMesAnterior = aulas.filter((a) => a.mesRef === mesAnterior);
  const resumoAnterior = calcularResumoMes(aulasMesAnterior);

  const fechamento = mesFechado(fechamentos, mesRef);
  const diverge = fechamento ? divergeDoSnapshot(fechamento, aulasMes) : false;

  const variacaoCentavos = variacaoPercentual(resumo.totalCentavos, resumoAnterior.totalCentavos);

  const dadosGrafico = resumo.valorPorDia.map((d) => ({
    dia: d.dia,
    valor: d.centavos / 100,
  }));

  const aulasRecentes = [...aulasMes]
    .sort((a, b) => b.data.localeCompare(a.data) || (b.horario ?? '').localeCompare(a.horario ?? ''))
    .slice(0, 5);
  void aulasRecentes; // reservado para seção de últimas aulas quando M6

  const kpis = [
    { label: 'A receber', valor: formatarCentavos(resumo.totalCentavos), variacao: variacaoCentavos },
    { label: 'Horas dadas', valor: formatarMinutos(resumo.totalMinutos), variacao: null },
    { label: 'Presenças', valor: String(resumo.totalPresencas), variacao: null },
    { label: 'Faltas', valor: String(resumo.totalFaltas), variacao: null },
  ];

  return (
    <div className="print:px-0 print:py-0">
      {/* Cabeçalho com seletor de mês */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => setMesRef(somarMes(mesRef, -1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{nomeMes(mesRef)}</h1>
        <button
          onClick={() => setMesRef(somarMes(mesRef, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Cabeçalho de impressão (visível só no PDF) */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Relatório de Aulas — {nomeMes(mesRef)}</h1>
      </div>

      {/* Selo de mês fechado */}
      {fechamento && (
        <div className={`rounded-lg px-3 py-2 mb-4 text-sm ${diverge ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-marca-50 text-marca-700 border border-marca-200'}`}>
          <strong>Mês fechado</strong> em {new Date(fechamento.fechadoEm).toLocaleDateString('pt-BR')}.
          {diverge && ' ⚠ Totais atuais divergem do snapshot (aula alterada após o fechamento).'}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="text-lg font-bold text-slate-800">{k.valor}</div>
            {k.variacao !== null && (
              <div className={`text-xs ${k.variacao === null ? '' : k.variacao > 0 ? 'text-marca-600' : k.variacao < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {k.variacao === null ? '' : k.variacao > 0 ? `↑ ${k.variacao}%` : k.variacao < 0 ? `↓ ${Math.abs(k.variacao)}%` : '—'}
                <span className="text-slate-400 ml-1">vs mês ant.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico de valor por dia */}
      {dadosGrafico.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 print:hidden">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Valor por dia</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatarCentavos(Number(v) * 100)} />
              <Bar dataKey="valor" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de aulas (visível no PDF) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Aulas do mês ({aulasMes.length})
        </h2>
        {aulasMes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma aula neste mês.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="print:hidden">
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="py-2">Data</th>
                <th className="py-2 hidden sm:table-cell">Aluno</th>
                <th className="py-2 sm:hidden">Aluno</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[...aulasMes].sort((a, b) => a.data.localeCompare(b.data)).map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-600">
                    {a.data.slice(8, 10)}/{a.data.slice(5, 7)} <span className="text-xs text-slate-400">{diaDaSemana(a.data)}</span>
                  </td>
                  <td className="py-1.5 text-slate-700">
                    {a.alunoNome}
                    <span className="ml-1 text-xs text-slate-400 hidden sm:inline">· {a.status}</span>
                  </td>
                  <td className="py-1.5 text-right font-medium text-slate-700">{formatarCentavos(a.valorCentavos)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-bold">
                <td className="py-2" colSpan={2}>Total</td>
                <td className="py-2 text-right text-marca-700">{formatarCentavos(resumo.totalCentavos)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Ações: fechar mês e imprimir */}
      <div className="flex gap-2 print:hidden">
        {fechamento ? (
          <button
            onClick={() => { if (confirm(`Reabrir ${mesRef}? Isso permite editar as aulas novamente.`)) reabrirMes(mesRef); }}
            className="rounded-lg border border-amber-300 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-50"
          >
            Reabrir mês
          </button>
        ) : (
          <button
            onClick={() => { if (confirm(`Fechar ${mesRef}? Cria um snapshot imutável. Para editar depois, é preciso reabrir.`)) fecharMes(mesRef); }}
            className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700"
            disabled={aulasMes.length === 0}
          >
            Fechar mês
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
      </div>
    </div>
  );
}
