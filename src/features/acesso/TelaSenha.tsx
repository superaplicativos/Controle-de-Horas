import { useState } from 'react';
import { carregarSync, salvarSync } from '../../data/storage';
import { baixarAcessoCifrado } from '../../data/acesso';
import { decifrarAcesso } from '../../data/cripto';
import { useStore } from '../../store/store';
import { BookOpen, Lock } from 'lucide-react';

/**
 * Tela "Digite a senha do sistema". (24.2 estado pedeSenha)
 * R-75: senha errada é recusada com mensagem clara.
 * R-78: senha esquecida + chave perdida = sem recuperação.
 */
export function TelaSenha() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [tentando, setTentando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setTentando(true);

    const sync = carregarSync();
    const repo = sync?.repo ?? '';
    if (!repo) {
      setErro('Repositório não configurado. Faça a primeira configuração.');
      setTentando(false);
      return;
    }

    const r = await baixarAcessoCifrado(repo);
    if (r.erro || !r.acesso) {
      setErro(r.rateLimit ? 'Muitas tentativas. Aguarde um minuto e tente de novo.' : (r.erro ?? 'Não foi possível ler o acesso'));
      setTentando(false);
      return;
    }

    try {
      const { chaveDados, token } = await decifrarAcesso(senha, r.acesso);
      // Salva material local → estado vira desbloqueado
      salvarSync({
        repo,
        branch: sync?.branch ?? 'dados',
        token,
        chaveDados,
      });
      // Força recarga do store
      window.location.reload();
    } catch {
      setErro('Senha incorreta');
      setTentando(false);
    }
  }

  void useStore;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-marca-600 flex items-center justify-center shadow-lg mb-3">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Controle de Horas</h1>
          <p className="text-sm text-slate-500 mt-1">Digite a senha do sistema</p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Lock className="inline w-3 h-3 mr-1" /> Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            disabled={tentando || senha.length < 1}
            className="w-full rounded-lg bg-marca-600 text-white py-2.5 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50"
          >
            {tentando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Esqueceu a senha? Use a chave de recuperação em outro aparelho com acesso.
          Sem a senha e sem a chave, não há recuperação.
        </p>
      </div>
    </div>
  );
}
