'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Cloud, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, Github, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { configurarGitHub, sincronizarDoGitHub, sincronizarParaGitHub, lerConfigLocal } from '@/lib/github';
import { exportarDadosProfessor, limparDadosProfessor } from '@/lib/db';
import { gerarBackupTXT, parseBackupTXT } from '@/lib/github';
import { resetarDadosProfessor } from '@/lib/seed';
import { format } from 'date-fns';

export default function ConfiguracoesPage() {
  const { professor } = useAuth();
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('superaplicativos/Controle-de-Horas');
  const [branch, setBranch] = useState('main');
  const [autoSync, setAutoSync] = useState(true);
  const [configurado, setConfigurado] = useState(false);
  const [ultimoSync, setUltimoSync] = useState<number | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await lerConfigLocal();
      if (c?.github_token) {
        setToken(c.github_token);
        setRepo(c.github_repo);
        setBranch(c.github_branch);
        setAutoSync(c.auto_sync);
        setConfigurado(true);
        setUltimoSync(c.ultimo_sync);
      }
    })();
  }, []);

  async function salvarConfig() {
    setSalvandoConfig(true);
    try {
      await configurarGitHub(token.trim(), repo.trim(), branch.trim() || 'main');
      setConfigurado(true);
      toast.success('Configuração salva!');
    } catch (e) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSalvandoConfig(false);
    }
  }

  async function sincronizarAgora(direcao: 'puxar' | 'enviar') {
    if (!professor) return;
    setSincronizando(true);
    try {
      const res = direcao === 'puxar'
        ? await sincronizarDoGitHub(professor.id)
        : await sincronizarParaGitHub(professor);
      if (res.ok) {
        toast.success(
          direcao === 'puxar'
            ? `Puxado do GitHub: ${res.aulasImportadas || 0} aulas`
            : `Enviado ao GitHub: ${res.aulasImportadas || 0} aulas`
        );
        const c = await lerConfigLocal();
        if (c) setUltimoSync(c.ultimo_sync);
      } else {
        toast.error(`Erro: ${res.erro}`);
      }
    } catch (e) {
      toast.error('Erro ao sincronizar');
    } finally {
      setSincronizando(false);
    }
  }

  async function exportarTXT() {
    if (!professor) return;
    const dados = await exportarDadosProfessor(professor.id);
    const backup = {
      versao: 1,
      exportado_em: new Date().toISOString(),
      professor: { nome: professor.nome, username: professor.username, valor_hora: professor.valor_hora },
      ...dados,
    };
    const txt = gerarBackupTXT(backup);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${professor.username}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup exportado!');
  }

  async function importarTXT(file: File) {
    if (!professor) return;
    const txt = await file.text();
    const backup = parseBackupTXT(txt);
    if (!backup) {
      toast.error('Arquivo inválido');
      return;
    }
    if (!confirm(`Importar ${backup.aulas.length} aulas do backup? Isto pode sobrescrever dados.`)) return;
    // Apenas dados deste professor (matching por nome ou importados como dele)
    const { salvarAula, salvarAluno, salvarTurma, salvarFechamento } = await import('@/lib/db');
    for (const a of backup.aulas) {
      if (a.professor_id === professor.id || !backup.aulas.some((x) => x.professor_id === professor.id)) {
        await salvarAula({ ...a, professor_id: professor.id });
      }
    }
    for (const a of backup.alunos) {
      if (a.professor_id === professor.id || !backup.alunos.some((x) => x.professor_id === professor.id)) {
        await salvarAluno({ ...a, professor_id: professor.id });
      }
    }
    for (const t of backup.turmas) {
      if (t.professor_id === professor.id || !backup.turmas.some((x) => x.professor_id === professor.id)) {
        await salvarTurma({ ...t, professor_id: professor.id });
      }
    }
    for (const f of backup.fechamentos) {
      if (f.professor_id === professor.id || !backup.fechamentos.some((x) => x.professor_id === professor.id)) {
        await salvarFechamento({ ...f, professor_id: professor.id });
      }
    }
    toast.success('Backup importado!');
  }

  async function limparTudo() {
    if (!professor) return;
    if (!confirm('APAGAR TODOS OS DADOS LOCAIS? Esta ação não pode ser desfeita.')) return;
    if (!confirm('Tem certeza? Faça um backup antes.')) return;
    await limparDadosProfessor(professor.id);
    toast.success('Dados locais apagados');
  }

  async function resetarDados() {
    if (!professor) return;
    if (!confirm('Isso vai APAGAR todas as suas aulas/alunos/turmas/fechamentos/cronograma e RECRIAR os dados padrão (Guilherme) no mês atual. Continuar?')) return;
    try {
      setSalvandoConfig(true);
      await resetarDadosProfessor(professor);
      toast.success('Dados resetados! Recarregando...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error('Erro ao resetar dados');
      setSalvandoConfig(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">GitHub sync, backup e gerenciamento</p>
      </div>

      {/* GitHub Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="w-5 h-5" /> Sincronização com GitHub
          </CardTitle>
          <CardDescription>
            Permite puxar e enviar os dados automaticamente do repo. Assim você acessa de qualquer dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!configurado && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Configure o GitHub sync</strong> para que os dados sejam puxados automaticamente
                ao abrir o app em qualquer dispositivo.
              </div>
            </div>
          )}
          {configurado && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>GitHub configurado!</strong>
                {ultimoSync && (
                  <div className="text-xs mt-1">
                    Último sync: {format(new Date(ultimoSync), "dd/MM/yyyy 'às' HH:mm")}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Personal Access Token (PAT)</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
            />
            <p className="text-xs text-muted-foreground">
              Crie em: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained.
              Permissões necessárias: <strong>Contents (read & write)</strong> no repo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Repositório (owner/repo)</Label>
              <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="superaplicativos/Controle-de-Horas" />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={autoSync} onCheckedChange={setAutoSync} id="autosync" />
            <Label htmlFor="autosync">Puxar automaticamente ao abrir o app</Label>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={salvarConfig} disabled={salvandoConfig} variant="outline">
              <Cloud className="w-4 h-4 mr-2" /> Salvar configuração
            </Button>
            <Button
              onClick={() => sincronizarAgora('puxar')}
              disabled={sincronizando || !token}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" /> {sincronizando ? 'Sincronizando...' : 'Puxar agora'}
            </Button>
            <Button
              onClick={() => sincronizarAgora('enviar')}
              disabled={sincronizando || !token}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" /> Enviar agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup TXT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup local (.txt)</CardTitle>
          <CardDescription>Exporte ou importe um arquivo .txt com todos os seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportarTXT} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Exportar .txt
            </Button>
            <label>
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) importarTXT(e.target.files[0]); }}
              />
              <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
                <Upload className="w-4 h-4" /> Importar .txt
              </span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            O arquivo .txt é legível (você pode abrir no Bloco de Notas) e também versionável no Git.
          </p>
        </CardContent>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zona de perigo</CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetarDados} disabled={salvandoConfig} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <RotateCcw className="w-4 h-4 mr-2" /> {salvandoConfig ? 'Resetando...' : 'Resetar dados (recriar padrão)'}
            </Button>
            <Button variant="outline" onClick={limparTudo} className="text-red-600 border-red-300 hover:bg-red-50">
              Apagar todos os dados locais
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Resetar dados</strong>: apaga tudo e recria as aulas padrão (KIDS, ADOLESCENTES, Joelma) no mês atual. Use se o dashboard estiver inconsistente.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Apagar tudo</strong>: limpa completamente, sem recriar nada.
          </p>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center py-4">
        <p><strong>Importante:</strong> seu token GitHub fica salvo apenas no seu navegador (IndexedDB).</p>
        <p>Nunca compartilhe seu token publicamente. Revogue tokens antigos em GitHub → Settings.</p>
      </div>
    </div>
  );
}
