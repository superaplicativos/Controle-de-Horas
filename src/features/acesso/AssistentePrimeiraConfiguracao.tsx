import { useState } from 'react';
import { salvarSync, carregarSync } from '../../data/storage';
import { detectarRepositorio, buscarRepoInfo, criarBranchDados, salvarArquivo, baixarArquivo } from '../../data/github';
import { cifrarAcesso, cifrarArquivo, importarChaveDados, chaveDadosAleatoria, chaveDadosParaBase64, formatarChaveRecuperacao, base64ParaChaveDados } from '../../data/cripto';
import { validarForcaSenha } from '../../data/senhas-comuns';
import { estadoVazio } from '../../domain/tipos';
import { salvarEstado } from '../../data/storage';
import { BookOpen, Eye, EyeOff, Copy, Download, Check, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Assistente de primeira configuração. (24.3, 5 passos)
 * 1. Senha do sistema
 * 2. Token
 * 3. Chave de recuperação
 * 4. Criação (branch + acesso.txt + arquivos cifrados)
 * 5. Oferecer importar histórico
 */
export function AssistentePrimeiraConfiguracao() {
  const [passo, setPasso] = useState(1);

  // Passo 1: senha
  const [senha, setSenha] = useState('');
  const [senhaConfirma, setSenhaConfirma] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const erroSenha = validarForcaSenha(senha);

  // Passo 2: token
  const detectado = detectarRepositorio(window.location.href);
  const repoPadrao = detectado ? `${detectado.owner}/${detectado.repo}` : '';
  const [repo, setRepo] = useState(repoPadrao);
  const [token, setToken] = useState('');
  const [validandoToken, setValidandoToken] = useState(false);
  const [repoConfirmado, setRepoConfirmado] = useState('');
  const [erroToken, setErroToken] = useState('');

  // Passo 3: chave de recuperação
  const [chaveDados] = useState(() => chaveDadosAleatoria());
  const [chaveGuardada, setChaveGuardada] = useState(false);

  // Passo 4: criação
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState('');

  // Passo 5: importar histórico
  const [, setPronto] = useState(false);

  // ===== Validações por passo =====
  function podeAvancarPasso1(): boolean {
    return !erroSenha && senha.length >= 10 && senha === senhaConfirma;
  }
  async function validarToken(): Promise<boolean> {
    setValidandoToken(true);
    setErroToken('');
    try {
      const partes = repo.split("/"); const owner = partes[0] ?? ""; const repoName = partes[1] ?? "";
      if (!owner || !repoName) {
        setErroToken('Use formato owner/repo');
        setValidandoToken(false);
        return false;
      }
      const info = await buscarRepoInfo(owner, repoName, token);
      void info;
      setRepoConfirmado(`${owner}/${repoName}`);
      setValidandoToken(false);
      return true;
    } catch (e) {
      setErroToken(e instanceof Error ? e.message : 'Token inválido');
      setValidandoToken(false);
      return false;
    }
  }
  function podeAvancarPasso2(): boolean {
    return !!repoConfirmado && !!token;
  }
  void podeAvancarPasso2;
  function podeAvancarPasso3(): boolean {
    return chaveGuardada;
  }

  // ===== Passo 4: criação =====
  async function criar() {
    setCriando(true);
    setErroCriacao('');
    try {
      const partes = repo.split("/"); const owner = partes[0] ?? ""; const repoName = partes[1] ?? "";
      const branch = 'dados';

      // 1. Cria branch dados
      await criarBranchDados(owner, repoName, branch, token);

      // 2. Cifra o acesso.txt com a senha
      const acessoCifrado = await cifrarAcesso(senha, {
        chaveDados: chaveDadosParaBase64(chaveDados),
        token,
      });
      const conteudoAcesso = JSON.stringify(acessoCifrado, null, 2);

      // 3. Salva acesso.txt
      const shaAcesso = await salvarArquivo(owner, repoName, branch, 'dados/acesso.txt', conteudoAcesso, null, token);

      // 4. Cria arquivos de dados iniciais (estado vazio) cifrados
      const chave = await importarChaveDados(chaveDados);
      const estado = estadoVazio();
      const textos = new Map<string, string>();
      textos.set('dados/config.txt', JSON.stringify({ versaoFormato: 1, config: estado.config }, null, 2));
      textos.set('dados/cadastros.txt', JSON.stringify({ versaoFormato: 1, alunos: [], turmas: [] }, null, 2));
      textos.set('dados/cronograma.txt', JSON.stringify({ versaoFormato: 1, cronograma: [] }, null, 2));
      textos.set('dados/fechamentos.txt', JSON.stringify({ versaoFormato: 1, fechamentos: [] }, null, 2));

      for (const [caminho, texto] of textos) {
        const cifrado = await cifrarArquivo(chave, texto, caminho);
        // Verifica se já existe (migração 24.9: se existe em texto puro, mescla)
        const existente = await baixarArquivo(owner, repoName, branch, caminho, token);
        let shaExistente = existente.sha;
        // Se existente é texto puro (sem iv/ct), mescla
        if (existente.conteudo) {
          try {
            const obj = JSON.parse(existente.conteudo);
            if (!obj.iv || !obj.ct) {
              // Texto puro legado — mescla com o vazio (mantém o legado)
              const legado = JSON.parse(existente.conteudo);
              const novoTexto = JSON.stringify(legado, null, 2);
              const novoCifrado = await cifrarArquivo(chave, novoTexto, caminho);
              await salvarArquivo(owner, repoName, branch, caminho, JSON.stringify(novoCifrado), shaExistente, token);
              continue;
            }
            shaExistente = existente.sha;
          } catch {
            // não é JSON, segue
          }
        }
        await salvarArquivo(owner, repoName, branch, caminho, JSON.stringify(cifrado), shaExistente, token);
      }

      // 5. Salva material local
      salvarSync({
        repo,
        branch,
        token,
        chaveDados: chaveDadosParaBase64(chaveDados),
      });
      salvarEstado(estado);

      void shaAcesso;
      setCriando(false);
      setPasso(5);
    } catch (e) {
      setErroCriacao(e instanceof Error ? e.message : 'Erro ao criar');
      setCriando(false);
    }
  }

  // ===== Renderização =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-marca-600 flex items-center justify-center shadow-lg mb-3">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Primeira configuração</h1>
          <p className="text-sm text-slate-500">Passo {passo} de 5</p>
        </div>

        {/* Indicador de passos */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((p) => (
            <div key={p} className={`flex-1 h-1 rounded-full ${p <= passo ? 'bg-marca-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {passo === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Senha do sistema</h2>
                <p className="text-xs text-slate-500 mb-3">
                  Esta senha protege os dados dos seus alunos. Sem ela e sem a chave de recuperação, não há como recuperar.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Senha (mínimo 10 caracteres)</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-marca-500 focus:outline-none"
                    autoFocus
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {erroSenha && <p className="text-xs text-red-600 mt-1">{erroSenha}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar senha</label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaConfirma}
                  onChange={(e) => setSenhaConfirma(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none"
                />
                {senhaConfirma && senha !== senhaConfirma && <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setPasso(2)}
                  disabled={!podeAvancarPasso1()}
                  className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50 flex items-center gap-1"
                >
                  Avançar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Token do GitHub</h2>
                <p className="text-xs text-slate-500 mb-3">
                  Crie um token fine-grained limitado a este repositório, com permissão Contents: Read and write.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Repositório (owner/repo)</label>
                <input value={repo} onChange={(e) => { setRepo(e.target.value); setRepoConfirmado(''); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Token</label>
                <input type="password" value={token} onChange={(e) => { setToken(e.target.value); setRepoConfirmado(''); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="github_pat_..." />
              </div>
              <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="text-xs text-marca-600 hover:underline block">
                Abrir página de criação de token →
              </a>
              {repoConfirmado && <p className="text-xs text-marca-600 flex items-center gap-1"><Check className="w-3 h-3" /> Repositório confirmado: {repoConfirmado}</p>}
              {erroToken && <p className="text-xs text-red-600">{erroToken}</p>}
              <div className="flex justify-between">
                <button onClick={() => setPasso(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={async () => { if (await validarToken()) setPasso(3); }}
                  disabled={!token || !repo || validandoToken}
                  className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {validandoToken ? 'Validando...' : 'Validar e avançar'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Chave de recuperação</h2>
                <p className="text-xs text-slate-500 mb-3">
                  Guarde esta chave em local seguro. Se esquecer a senha, ela é a única forma de recuperar o acesso.
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <code className="text-xs font-mono break-all">{formatarChaveRecuperacao(chaveDados)}</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(formatarChaveRecuperacao(chaveDados).replace(/\s/g, ''))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-slate-50"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([formatarChaveRecuperacao(chaveDados)], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'chave-recuperacao.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-slate-50"
                >
                  <Download className="w-3 h-3" /> Baixar .txt
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={chaveGuardada} onChange={(e) => setChaveGuardada(e.target.checked)} />
                Guardei a chave em local seguro
              </label>
              <div className="flex justify-between">
                <button onClick={() => setPasso(2)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setPasso(4)}
                  disabled={!podeAvancarPasso3()}
                  className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50 flex items-center gap-1"
                >
                  Avançar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {passo === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">Criar e cifrar</h2>
                <p className="text-xs text-slate-500 mb-3">
                  Vamos criar a branch <code>dados</code>, gravar o <code>acesso.txt</code> e os arquivos iniciais cifrados.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Repositório: <strong>{repo}</strong></li>
                <li>• Branch: <strong>dados</strong></li>
                <li>• Cifragem: AES-256-GCM</li>
                <li>• Derivação: PBKDF2-SHA256, 600000 iterações</li>
              </ul>
              {erroCriacao && <p className="text-sm text-red-600">{erroCriacao}</p>}
              <div className="flex justify-between">
                <button onClick={() => setPasso(3)} disabled={criando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={criar}
                  disabled={criando}
                  className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700 disabled:opacity-50"
                >
                  {criando ? 'Criando...' : 'Criar e cifrar'}
                </button>
              </div>
            </div>
          )}

          {passo === 5 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-marca-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-marca-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Tudo pronto!</h2>
              <p className="text-xs text-slate-500">
                Seus dados estão protegidos. Em qualquer aparelho novo, basta digitar a senha para ver os mesmos dados.
              </p>
              <button
                onClick={() => { setPronto(true); window.location.reload(); }}
                className="rounded-lg bg-marca-600 text-white px-4 py-2 text-sm font-semibold hover:bg-marca-700"
              >
                Entrar no sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

void carregarSync;
void base64ParaChaveDados;
