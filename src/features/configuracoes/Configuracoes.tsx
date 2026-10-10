import { useState, useEffect } from 'react';
import { useStore } from '../../store/store';
import { useStoreShallow } from '../../store/seletores';
import { salvarConfig } from '../../store/acoes';
import { formatarCentavos } from '../../domain/calculos';
import { carregarSync, sairDesteAparelho } from '../../data/storage';
import { sincronizar, subscribeStatus, type StatusSync } from '../../data/sync';
import { baixarBackup, importarBackupTxt } from '../../data/backup';
import { baixarEImportarLegado } from '../../data/legado';
import { cifrarAcesso, decifrarAcesso, formatarChaveRecuperacao, base64ParaChaveDados } from '../../data/cripto';
import { baixarAcessoCifrado } from '../../data/acesso';
import { baixarArquivo } from '../../data/github';
import { validarForcaSenha } from '../../data/senhas-comuns';
import { Link } from 'react-router-dom';

export function Configuracoes() {
  const config = useStore((s) => s.config);
  const pendentes = useStoreShallow((s) => s.meta.pendentes);

  const [nome, setNome] = useState(config.nome);
  const [valorHora, setValorHora] = useState(String((config.valorHoraCentavos / 100).toFixed(2)));
  const [valorFalta, setValorFalta] = useState(String((config.valorFaltaCentavos / 100).toFixed(2)));
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const [statusSync, setStatusSync] = useState<StatusSync>({
    status: 'ocioso', ultimoSync: null, ultimoErro: null, arquivosPendentes: 0,
  });

  // Trocar senha
  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaNovaConfirma, setSenhaNovaConfirma] = useState('');
  const [erroTrocaSenha, setErroTrocaSenha] = useState('');

  // Ver chave
  const [mostrarChave, setMostrarChave] = useState(false);
  const [senhaParaChave, setSenhaParaChave] = useState('');
  const [chaveVisivel, setChaveVisivel] = useState('');
  const [erroChave, setErroChave] = useState('');

  // Importar legado
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

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErroTrocaSenha('');
    const sync = carregarSync();
    if (!sync) return;

    const partes = sync.repo.split('/');
    const owner = partes[0] ?? '';
    const repoName = partes[1] ?? '';

    // Baixa o acesso.txt atual (precisa do sha para atualizar)
    const cont = await baixarArquivo(owner, repoName, sync.branch, 'dados/acesso.txt', sync.token);
    if (!cont.conteudo) { setErroTrocaSenha('acesso.txt não encontrado'); return; }

    let acessoCifrado: Parameters<typeof decifrarAcesso>[1];
    try { acessoCifrado = JSON.parse(cont.conteudo); } catch { setErroTrocaSenha('acesso.txt inválido'); return; }

    try {
      const { chaveDados, token } = await decifrarAcesso(senhaAtual, acessoCifrado);
      const erroForca = validarForcaSenha(senhaNova);
      if (erroForca) { setErroTrocaSenha(erroForca); return; }
      if (senhaNova !== senhaNovaConfirma) { setErroTrocaSenha('As senhas não coincidem'); return; }

      const novoAcesso = await cifrarAcesso(senhaNova, { chaveDados, token });
      const { salvarArquivo } = await import('../../data/github');
      await salvarArquivo(owner, repoName, sync.branch, 'dados/acesso.txt', JSON.stringify(novoAcesso, null, 2), cont.sha, token);

      setMensagem('Senha trocada com sucesso!');
      setMostrarTrocarSenha(false);
      setSenhaAtual(''); setSenhaNova(''); setSenhaNovaConfirma('');
    } catch {
      setErroTrocaSenha('Senha atual incorreta');
    }
  }

  async function verChave(e: React.FormEvent) {
    e.preventDefault();
    setErroChave('');
    const sync = carregarSync();
    if (!sync) return;

    const r = await baixarAcessoCifrado(sync.repo);
    if (!r.acesso) { setErroChave(r.erro ?? 'Erro ao ler acesso'); return; }

    try {
      const { chaveDados } = await decifrarAcesso(senhaParaChave, r.acesso);
      const bytes = base64ParaChaveDados(chaveDados);
      setChaveVisivel(formatarChaveRecuperacao(bytes));
    } catch {
      setErroChave('Senha incorreta');
    }
  }

  function sair() {
    if (!confirm('Sair deste aparelho? Os dados locais serão apagados. Os dados na nuvem permanecem. Você vai precisar digitar a senha para entrar de novo.')) return;
    sairDesteAparelho();
    window.location.reload();
  }

  async function sincronizarAgora() {
    setErro('');
    try { await sincronizar(); } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Sincronização</h2>
        <p className="text-xs text-slate-500">
          Status: {statusSync.status === 'sincronizando' ? 'Sincronizando...' : statusSync.status === 'sincronizado' && statusSync.ultimoSync ? `Sincronizado em ${new Date(statusSync.ultimoSync).toLocaleString('pt-BR')}` : statusSync.status === 'erro' ? `Erro: ${statusSync.ultimoErro}` : 'Ocioso'}
        </p>
        <p className="text-xs text-slate-500">Arquivos pendentes: {pendentes.length}</p>
        <button onClick={sincronizarAgora} className="rounded-lg border border-marca-300 text-marca-700 px-4 py-2 text-sm font-semibold hover:bg-marca-50">
          Sincronizar agora
        </button>
      </div>

      {/* Segurança */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Segurança</h2>
        <button onClick={() => setMostrarTrocarSenha(!mostrarTrocarSenha)} className="block w-full text-left text-sm text-marca-600 hover:underline">
          Trocar senha
        </button>
        {mostrarTrocarSenha && (
          <form onSubmit={trocarSenha} className="space-y-2 rounded-lg bg-slate-50 p-3">
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Senha atual" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <input type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="Nova senha (mín 10 chars)" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            <input type="password" value={senhaNovaConfirma} onChange={(e) => setSenhaNovaConfirma(e.target.value)} placeholder="Confirmar nova senha" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            {erroTrocaSenha && <p className="text-xs text-red-600">{erroTrocaSenha}</p>}
            <button type="submit" className="rounded bg-marca-600 text-white px-4 py-2 text-sm font-semibold">Trocar</button>
          </form>
        )}
        <button onClick={() => setMostrarChave(!mostrarChave)} className="block w-full text-left text-sm text-marca-600 hover:underline">
          Ver chave de recuperação
        </button>
        {mostrarChave && (
          <form onSubmit={verChave} className="space-y-2 rounded-lg bg-slate-50 p-3">
            <input type="password" value={senhaParaChave} onChange={(e) => setSenhaParaChave(e.target.value)} placeholder="Digite a senha para ver a chave" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
            {erroChave && <p className="text-xs text-red-600">{erroChave}</p>}
            {chaveVisivel && (
              <div className="rounded bg-white border border-slate-200 p-2">
                <code className="text-xs font-mono break-all">{chaveVisivel}</code>
              </div>
            )}
            <button type="submit" className="rounded bg-marca-600 text-white px-4 py-2 text-sm font-semibold">Mostrar</button>
          </form>
        )}
        <button onClick={sair} className="block w-full text-left text-sm text-red-600 hover:underline">
          Sair deste aparelho
        </button>
      </div>

      {/* Backup e importação */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Backup e importação</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => baixarBackup(useStore.getState())} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Exportar backup .txt</button>
          <label className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer">
            Importar backup .txt
            <input type="file" accept=".txt" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              file.text().then((conteudo) => {
                const r = importarBackupTxt(conteudo);
                if (r.erro) setErro(r.erro);
                else setMensagem(`Backup importado! ${r.alteracoes} registros mesclados.`);
              });
            }} />
          </label>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500 mb-2">Importar histórico antigo (30 aulas, R$ 1.960). Importar duas vezes não duplica.</p>
          <button
            onClick={async () => {
              setMensagem(''); setErro(''); setImportandoLegado(true);
              const r = await baixarEImportarLegado();
              setImportandoLegado(false);
              if (r.erro) setErro(r.erro);
              else setMensagem(`Histórico importado! ${r.alteracoes} registros mesclados.`);
            }}
            disabled={importandoLegado}
            className="rounded-lg border border-amber-300 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50"
          >
            {importandoLegado ? 'Baixando...' : 'Importar histórico antigo'}
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

      {mensagem && <div className="rounded-lg bg-marca-50 border border-marca-200 px-4 py-2 text-sm text-marca-700 mb-4">{mensagem}</div>}
      {erro && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 mb-4">{erro}</div>}
    </div>
  );
}
