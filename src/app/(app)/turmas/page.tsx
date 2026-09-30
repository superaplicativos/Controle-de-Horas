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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-sm text-muted-foreground">{turmas.length} cadastradas</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditandoId(null); setNome(''); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
            <div className="p-8 text-center text-muted-foreground">Nenhuma turma cadastrada.</div>
          ) : (
            <div className="divide-y">
              {turmas.map((t) => {
                const alunosDaTurma = alunos.filter((a) => a.turma_id === t.id);
                return (
                  <div key={t.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <Users2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{t.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {alunosDaTurma.length} aluno(s) vinculado(s)
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editar(t)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => excluir(t.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
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
