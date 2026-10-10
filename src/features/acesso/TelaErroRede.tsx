import { useState } from 'react';

/** 24.2 estado erroRede: mensagem com botão tentar de novo, sem apagar nada. */
export function TelaErroRede() {
  const [tentando, setTentando] = useState(false);

  function tentar() {
    setTentando(true);
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-lg font-bold text-slate-800 mb-2">Sem conexão</h1>
        <p className="text-sm text-slate-500 mb-4">
          Não foi possível conectar ao GitHub para verificar seus dados. Verifique sua internet e tente de novo.
        </p>
        <button
          onClick={tentar}
          disabled={tentando}
          className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50"
        >
          {tentando ? 'Tentando...' : 'Tentar de novo'}
        </button>
      </div>
    </div>
  );
}
