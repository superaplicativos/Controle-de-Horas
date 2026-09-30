'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarAlunosPorProfessor, salvarAluno, deletarAluno, listarTurmasPorProfessor } from '@/lib/db';
import type { Aluno, Turma } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { gerarId } from '@/lib/crypto';
import { useSync } from '@/lib/useSync';

export default function AlunosPage() {
  const { professor } = useAuth();
  const { notificar } = useSync();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Aluno>>({ nome: '', tipo: 'vip', turma_id: null, ativo: true });

  const carregar = useCallback(async () => {
    if (!professor) return;
    const [al, t] = await Promise.all([
      listarAlunosPorProfessor(professor.id),
      listarTurmasPorProfessor(professor.id),
    ]);
    setAlunos(al.sort((a, b) => a.nome.localeCompare(b.nome)));
    setTurmas(t);
  }, [professor]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor) return;
    if (!form.nome?.trim()) { toast.error('Nome obrigatório'); return; }

    const aluno: Aluno = {
      id: editandoId || gerarId(),
      professor_id: professor.id,
      nome: form.nome.trim(),
      tipo: form.tipo as 'vip' | 'turma',
      turma_id: form.tipo === 'turma' ? (form.turma_id || null) : null,
      ativo: form.ativo ?? true,
      criado_em: Date.now(),
    };
    await salvarAluno(aluno);
    toast.success(editandoId ? 'Aluno atualizado!' : 'Aluno cadastrado!');
    notificar();
    setModalOpen(false);
    setEditandoId(null);
    setForm({ nome: '', tipo: 'vip', turma_id: null, ativo: true });
    carregar();
  }

  function editar(a: Aluno) {
    setEditandoId(a.id);
    setForm({ nome: a.nome, tipo: a.tipo, turma_id: a.turma_id, ativo: a.ativo });
    setModalOpen(true);
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este aluno? As aulas relacionadas serão mantidas.')) return;
    await deletarAluno(id);
    toast.success('Aluno excluído');
    notificar();
    carregar();
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Alunos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{alunos.length} cadastrados</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0" onClick={() => {
              setEditandoId(null);
              setForm({ nome: '', tipo: 'vip', turma_id: null, ativo: true });
            }}>
              <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Novo Aluno</span><span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editandoId ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Maria Silva / Turma Manhã" required />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'vip' | 'turma' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vip">VIP (individual)</SelectItem>
                    <SelectItem value="turma">Turma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.tipo === 'turma' && (
                <div className="space-y-1.5">
                  <Label>Turma</Label>
                  <Select value={form.turma_id || ''} onValueChange={(v) => setForm({ ...form, turma_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a turma..." /></SelectTrigger>
                    <SelectContent>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {turmas.length === 0 && (
                    <p className="text-xs text-muted-foreground">Cadastre turmas primeiro na aba Turmas.</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(c) => setForm({ ...form, ativo: c })} id="ativo" />
                <Label htmlFor="ativo">Ativo</Label>
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
          {alunos.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-muted-foreground">
              <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum aluno cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y">
              {alunos.map((a) => {
                const turma = turmas.find((t) => t.id === a.turma_id);
                return (
                  <div key={a.id} className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-muted/30">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {a.tipo === 'turma' ? <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" /> : <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{a.nome}</span>
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {a.tipo === 'turma' ? 'TURMA' : 'VIP'}
                        </span>
                        {!a.ativo && <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Inativo</span>}
                      </div>
                      {turma && <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{turma.nome}</div>}
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => excluir(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
