import { useStore } from '../../store/store';
import { relerNuvem, sincronizar, subscribeStatus, type StatusSync } from '../../data/sync';
import { useEffect, useState } from 'react';

export function Diagnostico() {
  const alunos = useStore((s) => s.alunos.filter((a) => !a.excluido).length);
  const turmas = useStore((s) => s.turmas.filter((t) => !t.excluido).length);
  const aulas = useStore((s) => s.aulas.filter((a) => !a.excluido).length);
  const cronograma = useStore((s) => s.cronograma.filter((c) => !c.excluido).length);
  const fechamentos = useStore((s) => s.fechamentos.filter((f) => !f.excluido).length);
  const meta = useStore((s) => s.meta);

  const [status, setStatus] = useState<StatusSync>({
    status: 'ocioso',
    ultimoSync: null,
    ultimoErro: null,
    arquivosPendentes: 0,
  });

  useEffect(() => {
    return subscribeStatus(setStatus);
  }, []);

  const buildId = import.meta.env.VITE_BUILD_ID ?? 'dev';

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Diagnóstico</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Contagem local</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-400">Alunos:</span> <strong>{alunos}</strong></div>
          <div><span className="text-slate-400">Turmas:</span> <strong>{turmas}</strong></div>
          <div><span className="text-slate-400">Aulas:</span> <strong>{aulas}</strong></div>
          <div><span className="text-slate-400">Cronograma:</span> <strong>{cronograma}</strong></div>
          <div><span className="text-slate-400">Fechamentos:</span> <strong>{fechamentos}</strong></div>
          <div><span className="text-slate-400">Build:</span> <strong className="text-xs">{buildId.slice(0, 7)}</strong></div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Sincronização</h2>
        <div className="text-xs text-slate-500 space-y-1 mb-3">
          <p>Status: <strong>{status.status}</strong></p>
          <p>Último sync: {meta.ultimoSync ? new Date(meta.ultimoSync).toLocaleString('pt-BR') : 'nunca'}</p>
          <p>Último erro: {meta.ultimoErro ?? 'nenhum'}</p>
          <p>Arquivos pendentes: {meta.pendentes.length}</p>
          {meta.pendentes.length > 0 && (
            <ul className="list-disc list-inside text-slate-400">
              {meta.pendentes.map((p) => (<li key={p}>{p}</li>))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { sincronizar().catch((e: unknown) => console.error('sync manual:', e)); }}
            className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700"
          >
            Sincronizar agora
          </button>
          <button
            onClick={() => { relerNuvem(); }}
            className="rounded-lg border border-amber-300 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-50"
          >
            Reler a nuvem
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          "Reler a nuvem" zera os shas guardados para forçar nova leitura. Nunca apaga dado local.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">SHAs guardados</h2>
        {Object.keys(meta.shas).length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum sha guardado ainda.</p>
        ) : (
          <ul className="text-xs text-slate-500 space-y-1">
            {Object.entries(meta.shas).map(([caminho, sha]) => (
              <li key={caminho} className="flex justify-between gap-2">
                <span className="truncate">{caminho}</span>
                <span className="font-mono text-slate-400">{sha.slice(0, 7)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
