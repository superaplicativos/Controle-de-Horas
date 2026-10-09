'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cloud, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { puxarDoGitHub, enviarParaGitHub, subscribeSyncState } from '@/lib/sync';
import { gerarBackupTXT, parseBackupTXT } from '@/lib/backup';
import { exportarDadosProfessor, limparDadosProfessor } from '@/lib/db';
import { format } from 'date-fns';

export default function ConfiguracoesPage() {
  const { professor } = useAuth();
  const [ultimoSync, setUltimoSync] = useState<number | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  // Mostra data/hora do último sync que o módulo de sync registrou.
  useEffect(() => {
    const unsub = subscribeSyncState((s) => {
      if (s.ultimoSync) setUltimoSync(s.ultimoSync);
    });
    return unsub;
  }, []);

  async function sincronizarAgora(direcao: 'puxar' | 'enviar') {
    if (!professor) return;
    setSincronizando(true);
    try {
      const res = direcao === 'puxar'
        ? await puxarDoGitHub(professor)
        : await enviarParaGitHub(professor);
      if (res.status === 'synced') {
        toast.success(
          direcao === 'puxar'
            ? `Dados puxados do banco: ${res.aulasSincronizadas || 0} alterações`
            : `Dados enviados ao banco!`
        );
        setUltimoSync(Date.now());
      } else if (res.status === 'error') {
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
    if (!confirm('Isso vai APAGAR todas as suas aulas/alunos/turmas/fechamentos/cronograma. Faça um backup antes. Continuar?')) return;
    try {
      setSincronizando(true);
      await limparDadosProfessor(professor.id);
      toast.success('Dados locais apagados!');
      setSincronizando(false);
    } catch (e) {
      toast.error('Erro ao apagar dados');
      setSincronizando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold">Configurações</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Sync, backup e gerenciamento</p>
      </div>

      {/* Status de Sincronização */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> Sincronização automática
          </CardTitle>
          <CardDescription className="text-xs">
            Sync ativado e funcionando. Seus dados são salvos automaticamente na nuvem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-emerald-100/50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex gap-2">
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Tudo configurado!</strong> Não precisa mexer em nada. Quando você criar, editar ou deletar qualquer item, ele é sincronizado automaticamente em ~2 segundos.
              {ultimoSync && (
                <div className="text-[11px] mt-1">
                  Último sync: {format(new Date(ultimoSync), "dd/MM/yyyy 'às' HH:mm")}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              onClick={() => sincronizarAgora('puxar')}
              disabled={sincronizando}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" /> {sincronizando ? 'Sincronizando...' : 'Puxar agora'}
            </Button>
            <Button
              onClick={() => sincronizarAgora('enviar')}
              disabled={sincronizando}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" /> Enviar agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup TXT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Backup local (.txt)</CardTitle>
          <CardDescription className="text-xs">Exporte ou importe um arquivo .txt com todos os seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button onClick={exportarTXT} variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" /> Exportar .txt
            </Button>
            <label className="w-full sm:w-auto">
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) importarTXT(e.target.files[0]); }}
              />
              <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer w-full">
                <Upload className="w-4 h-4" /> Importar .txt
              </span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            O arquivo .txt é legível (você pode abrir no Bloco de Notas) e também serve como backup de segurança.
          </p>
        </CardContent>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base text-red-600">Zona de perigo</CardTitle>
          <CardDescription className="text-xs">Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button variant="outline" onClick={resetarDados} disabled={sincronizando} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <RotateCcw className="w-4 h-4 mr-2" /> {sincronizando ? 'Limpando...' : 'Apagar dados locais'}
            </Button>
            <Button variant="outline" onClick={limparTudo} className="text-red-600 border-red-300 hover:bg-red-50">
              Apagar todos os dados locais
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Apagar dados</strong>: limpa tudo do navegador. A próxima vez que abrir o app, os dados voltam do banco na nuvem.
          </p>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center py-4">
        <p>Seus dados são sincronizados via Cloudflare Worker + GitHub.</p>
        <p className="mt-1">Token GitHub protegido no servidor — nunca exposto no navegador.</p>
      </div>
    </div>
  );
}
