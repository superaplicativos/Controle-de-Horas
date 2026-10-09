import { formatarCentavos } from '../../domain/calculos';
import { hojeLocal, nomeMes, mesRefAtual } from '../../domain/datas';

/**
 * Página mínima do M1. (seção 21)
 *
 * Mostra que o app abre, que o domain funciona e que o build publica.
 * As telas reais (aulas, calendário, etc.) vêm nos próximos marcos.
 */
export function PaginaInicial() {
  const hoje = hojeLocal();
  const mes = mesRefAtual();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-marca-700 mb-2">Controle de Horas</h1>
        <p className="text-slate-500 mb-6">Sistema de gestão para professor autônomo.</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-slate-500">Hoje</div>
            <div className="font-semibold">{hoje}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-slate-500">Mês atual</div>
            <div className="font-semibold">{nomeMes(mes)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-slate-500">Valor da hora</div>
            <div className="font-semibold">{formatarCentavos(3500)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="text-slate-500">Valor da falta</div>
            <div className="font-semibold">{formatarCentavos(3500)}</div>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          M1 — base do projeto. Próximos marcos adicionam CRUD, dashboard, sync e GitHub.
        </p>
      </div>
    </main>
  );
}
