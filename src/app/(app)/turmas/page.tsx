'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarTurmasPorProfessor, salvarTurma, deletarTurma, listarAlunosPorProfessor } from '@/lib/db';
import type { Turma, Aluno } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { gerarId } from '@/lib/crypto';

export default function TurmasPage() {
  const { professor } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');

  const carregar = useCallback(async () => {
    if (!professor) return;
    const [t, al] = await Promise.all([
      listarTurmasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
    ]);
    setTurmas(t.sort((a, b) => a.nome.localeCompare(b.nome)));
    setAlunos(al);
  }, [professor]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor) return;
    if (!nome.trim()) { toast.error('Nome obrigatório'); return; }
    const t: Turma = {
      id: editandoId || gerarId(),
      professor_id: professor.id,
      nome: nome.trim(),
      criado_em: Date.now(),
    };
    await salvarTurma(t);
    toast.success(editandoId ? 'Turma atualizada!' : 'Turma criada!');
    setModalOpen(false);
    setEditandoId(null);
    setNome('');
    carregar();
  }

  function editar(t: Turma) {
    setEditandoId(t.id);
    setNome(t.nome);
    setModalOpen(true);
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta turma? Alunos vinculados ficarão sem turma.')) return;
    await deletarTurma(id);
    toast.success('Turma excluída');
    carregar();
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Turmas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{turmas.length} cadastradas</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0" onClick={() => { setEditandoId(null); setNome(''); }}>
              <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Nova Turma</span><span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editandoId ? 'Editar Turma' : 'Nova Turma'}</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome da turma</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Turma Kids, Turma Manhã..." required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {turmas.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-muted-foreground">
              <Users2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma turma cadastrada.</p>
            </div>
          ) : (
            <div className="divide-y">
              {turmas.map((t) => {
                const alunosDaTurma = alunos.filter((a) => a.turma_id === t.id);
                return (
                  <div key={t.id} className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-muted/30">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{t.nome}</div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground">
                        {alunosDaTurma.length} aluno(s) vinculado(s)
                      </div>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => excluir(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
