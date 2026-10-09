import { useState, useEffect } from 'react';
import { useStore } from '../../store/store';
import { useStoreShallow } from '../../store/seletores';
import { salvarConfig } from '../../store/acoes';
import { formatarCentavos } from '../../domain/calculos';
import { carregarSync, salvarSync, limparSync, copiarConfiguracao, colarConfiguracao } from '../../data/storage';
import { detectarRepositorio, buscarRepoInfo } from '../../data/github';
import { sincronizar, subscribeStatus, type StatusSync } from '../../data/sync';
import { baixarBackup, importarBackupTxt } from '../../data/backup';
import { baixarEImportarLegado } from '../../data/legado';
import { Link } from 'react-router-dom';

export function Configuracoes() {
  const config = useStore((s) => s.config);
  const pendentes = useStoreShallow((s) => s.meta.pendentes);

  const [nome, setNome] = useState(config.nome);
  const [valorHora, setValorHora] = useState(String((config.valorHoraCentavos / 100).toFixed(2)));
  const [valorFalta, setValorFalta] = useState(String((config.valorFaltaCentavos / 100).toFixed(2)));
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  // Sync
  const syncAtual = carregarSync();
  const detectado = detectarRepositorio(window.location.href);
  const repoPadrao = detectado ? `${detectado.owner}/${detectado.repo}` : '';
  const [repo, setRepo] = useState(syncAtual?.repo ?? repoPadrao);
  const [branch, setBranch] = useState(syncAtual?.branch ?? 'dados');
  const [token, setToken] = useState(syncAtual?.token ?? '');
  const [avisoPublico, setAvisoPublico] = useState<boolean | null>(null);
  const [entendiPublico, setEntendiPublico] = useState(false);
  const [erroSync, setErroSync] = useState('');
  const [salvandoSync, setSalvandoSync] = useState(false);

  const [statusSync, setStatusSync] = useState<StatusSync>({
    status: 'ocioso',
    ultimoSync: null,
    ultimoErro: null,
    arquivosPendentes: 0,
  });

  // Backup, legado, copiar/colar
  const [mensagem, setMensagem] = useState('');
  const [colarInput, setColarInput] = useState('');
  const [importandoLegado, setImportandoLegado] = useState(false);

  useEffect(() => {
    return subscribeStatus(setStatusSync);
  }, []);

  function submitConfig(e: React.FormEvent) {
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

  async function testarESalvarSync(e: React.FormEvent) {
    e.preventDefault();
    setErroSync(''); setSalvandoSync(true);
    try {
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) throw new Error('Use formato owner/repo');
      // Testa buscando info do repo
      const info = await buscarRepoInfo(owner, repoName, token);
      setAvisoPublico(!info.private);
      salvarSync({ repo, branch, token });
    } catch (err) {
      setErroSync(err instanceof Error ? err.message : 'Erro ao testar');
    } finally {
      setSalvandoSync(false);
    }
  }

  function removerToken() {
    limparSync();
    setToken('');
    setAvisoPublico(null);
  }

  async function sincronizarAgora() {
    setErroSync('');
    try {
      await sincronizar();
    } catch (err) {
      setErroSync(err instanceof Error ? err.message : 'Erro');
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Configurações</h1>

      {/* Dados do professor */}
      <form onSubmit={submitConfig} className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
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

      {/* Sincronização */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Sincronização entre aparelhos</h2>
        <p className="text-xs text-slate-500">
          Status: {statusSync.status === 'sincronizando' ? 'Sincronizando...' : statusSync.status === 'sincronizado' && statusSync.ultimoSync ? `Sincronizado em ${new Date(statusSync.ultimoSync).toLocaleString('pt-BR')}` : statusSync.status === 'erro' ? `Erro: ${statusSync.ultimoErro}` : 'Somente neste aparelho'}
        </p>
        <p className="text-xs text-slate-500">Arquivos pendentes: {pendentes.length}</p>

        <form onSubmit={testarESalvarSync} className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Repositório (owner/repo)</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="usuario/repositorio" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Token (fine-grained, permissão Contents)</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="github_pat_..." />
          </div>
          {erroSync && <p className="text-sm text-red-600">{erroSync}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={salvandoSync} className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50">
              {salvandoSync ? 'Testando...' : 'Testar e salvar'}
            </button>
            {token && (
              <button type="button" onClick={removerToken} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Remover token</button>
            )}
            <button type="button" onClick={sincronizarAgora} disabled={!token} className="rounded-lg border border-marca-300 text-marca-700 px-4 py-2 text-sm font-semibold hover:bg-marca-50 disabled:opacity-50">
              Sincronizar agora
            </button>
          </div>
        </form>

        {avisoPublico && !entendiPublico && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            ⚠ Este repositório é <strong>público</strong>. Qualquer pessoa pode ler os arquivos da branch <code>{branch}</code>, que contêm nomes de alunos.
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={entendiPublico} onChange={(e) => setEntendiPublico(e.target.checked)} />
              Entendi, continuar
            </label>
          </div>
        )}
      </div>

      {/* Copiar/Colar configuração (R-53) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Transferir configuração para outro aparelho</h2>
        <p className="text-xs text-slate-500">Evita digitar o token duas vezes. Copie aqui, cole no outro aparelho.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const linha = copiarConfiguracao();
              if (linha) {
                navigator.clipboard.writeText(linha);
                setMensagem('Configuração copiada! Cole no outro aparelho.');
              } else {
                setErro('Nenhuma configuração salva ainda.');
              }
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Copiar configuração
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={colarInput}
            onChange={(e) => setColarInput(e.target.value)}
            placeholder="Cole aqui a linha do outro aparelho"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              const r = colarConfiguracao(colarInput);
              if (r.ok && r.config) {
                setRepo(r.config.repo);
                setBranch(r.config.branch);
                setToken(r.config.token);
                setMensagem('Configuração colada e salva!');
                setColarInput('');
              } else {
                setErro(r.erro ?? 'Erro ao colar');
              }
            }}
            className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700"
          >
            Colar
          </button>
        </div>
      </div>

      {/* Backup e importação (R-48) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Backup e importação</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => baixarBackup(useStore.getState())}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Exportar backup .txt
          </button>
          <label className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer">
            Importar backup .txt
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then((conteudo) => {
                  const r = importarBackupTxt(conteudo);
                  if (r.erro) setErro(r.erro);
                  else setMensagem(`Backup importado! ${r.alteracoes} registros mesclados.`);
                });
              }}
            />
          </label>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-1">Importar histórico antigo</h3>
          <p className="text-xs text-slate-500 mb-2">Baixa o backup do sistema anterior (Next.js) e mescla com os dados atuais. Importar duas vezes não duplica.</p>
          <button
            onClick={async () => {
              setMensagem('');
              setErro('');
              setImportandoLegado(true);
              const r = await baixarEImportarLegado();
              setImportandoLegado(false);
              if (r.erro) setErro(r.erro);
              else setMensagem(`Histórico importado! ${r.alteracoes} registros mesclados.`);
            }}
            disabled={importandoLegado}
            className="rounded-lg border border-amber-300 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50"
          >
            {importandoLegado ? 'Baixando e importando...' : 'Importar histórico antigo'}
          </button>
        </div>
      </div>

      {/* Resumo + Diagnóstico */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Resumo</h2>
        <div className="text-xs text-slate-500 space-y-1">
          <p>Valor da hora: <strong>{formatarCentavos(config.valorHoraCentavos)}</strong></p>
          <p>Valor da falta: <strong>{formatarCentavos(config.valorFaltaCentavos)}</strong></p>
        </div>
        <Link to="/diagnostico" className="inline-block mt-3 text-sm text-marca-600 hover:underline">Ver Diagnóstico →</Link>
      </div>

      {/* Mensagens */}
      {mensagem && <div className="rounded-lg bg-marca-50 border border-marca-200 px-4 py-2 text-sm text-marca-700 mb-4">{mensagem}</div>}
      {erro && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 mb-4">{erro}</div>}
    </div>
  );
}
