import { Link } from 'react-router-dom';
import { useStore } from '../../store/store';
import { alunosVisiveis, turmasVisiveis, aulasVisiveis, cronogramaVisivel } from '../../store/seletores';
import { formatarCentavos, calcularResumoMes } from '../../domain/calculos';
import { mesRefAtual, nomeMes } from '../../domain/datas';

export function PaginaInicial() {
  const config = useStore((s) => s.config);
  const alunos = useStore(alunosVisiveis);
  const turmas = useStore(turmasVisiveis);
  const aulas = useStore(aulasVisiveis);
  const cronograma = useStore(cronogramaVisivel);

  const mes = mesRefAtual();
  const aulasMes = aulas.filter((a) => a.mesRef === mes);
  const resumo = calcularResumoMes(aulasMes);

  const cards = [
    { label: 'Aulas neste mês', valor: String(resumo.totalAulas), href: '/aulas' },
    { label: 'A receber este mês', valor: formatarCentavos(resumo.totalCentavos), href: '/aulas' },
    { label: 'Alunos ativos', valor: String(alunos.filter((a) => a.ativo).length), href: '/alunos' },
    { label: 'Turmas', valor: String(turmas.length), href: '/turmas' },
    { label: 'Itens no cronograma', valor: String(cronograma.length), href: '/cronograma' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Olá, {config.nome}</h1>
      <p className="text-sm text-slate-500 mb-6">{nomeMes(mes)}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-marca-400 hover:shadow-sm transition-all"
          >
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className="text-xl font-bold text-slate-800">{c.valor}</div>
          </Link>
        ))}
      </div>

      {aulasMes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500 mb-3">Nenhuma aula em {nomeMes(mes)} ainda.</p>
          <Link
            to="/aulas"
            className="inline-block rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700"
          >
            Lançar primeira aula
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Últimas aulas do mês</h2>
          <div className="space-y-1">
            {aulasMes.slice(-5).reverse().map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600">
                  {a.data.slice(8, 10)}/{a.data.slice(5, 7)} · {a.alunoNome}
                </span>
                <span className="font-semibold text-slate-700">{formatarCentavos(a.valorCentavos)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
