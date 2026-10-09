import { useStore } from '../store/store';
import { baixarBackupBruto, limparEstado } from '../data/storage';

/** R-34: tela de erro quando o armazenamento local está corrompido. */
export function TelaCorrompida({ erro }: { erro: string }) {
  function baixar() {
    const conteudo = baixarBackupBruto();
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-bruto-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function limparERecarregar() {
    if (!confirm('Isto vai apagar os dados locais corrompidos e recomeçar do zero. Seus dados na nuvem (se houver sync configurado) não são afetados. Continuar?')) return;
    limparEstado();
    window.location.reload();
  }

  // eslint não sabe que este componente só renderiza no erro; pegamos config mesmo assim
  void useStore;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg rounded-2xl border border-red-300 bg-red-50 p-8">
        <h1 className="text-2xl font-bold text-red-700 mb-3">Dados locais corrompidos</h1>
        <p className="text-sm text-red-600 mb-4">{erro}</p>
        <div className="space-y-3">
          <button
            onClick={baixar}
            className="block w-full rounded-lg bg-slate-700 text-white py-2 px-4 text-sm font-semibold hover:bg-slate-800"
          >
            Baixar cópia do conteúdo bruto
          </button>
          <button
            onClick={limparERecarregar}
            className="block w-full rounded-lg bg-red-600 text-white py-2 px-4 text-sm font-semibold hover:bg-red-700"
          >
            Limpar e recomeçar do zero
          </button>
        </div>
      </div>
    </div>
  );
}
