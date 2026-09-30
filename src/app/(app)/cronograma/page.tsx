'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarCronogramaPorProfessor, salvarCronogramaItem, deletarCronogramaItem, listarAlunosPorProfessor } from '@/lib/db';
import type { CronogramaItem, Aluno } from '@/types';
import { hojeISO, diaDaSemana, nomeMes, mesAtualRef } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarClock, Search, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { gerarId } from '@/lib/crypto';

const DURACOES: (1 | 1.5 | 2)[] = [1, 1.5, 2];

export default function CronogramaPage() {
  const { professor } = useAuth();
  const [itens, setItens] = useState<CronogramaItem[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroMes, setFiltroMes] = useState<string>(mesAtualRef());
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CronogramaItem>>({
    titulo: '',
    aluno_nome: '',
    data: hojeISO(),
    horario: '15:00',
    duracao: 2,
    observacao: '',
  });

  const carregar = useCallback(async () => {
    if (!professor) return;
    const [c, al] = await Promise.all([
      listarCronogramaPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
    ]);
    setItens(c.sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)));
    setAlunos(al.filter((x) => x.ativo));
  }, [professor]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor) return;
    if (!form.data) { toast.error('Selecione a data'); return; }
    if (!form.titulo?.trim() && !form.aluno_nome?.trim()) {
      toast.error('Informe o título ou o aluno');
      return;
    }

    const item: CronogramaItem = {
      id: editandoId || gerarId(),
      professor_id: professor.id,
      titulo: form.titulo?.trim() || form.aluno_nome?.trim() || 'Aula',
      aluno_nome: form.aluno_nome?.trim() || '',
      data: form.data,
      horario: form.horario || '',
      duracao: (form.duracao || 2) as 1 | 1.5 | 2,
      observacao: form.observacao || '',
      criado_em: Date.now(),
    };

    await salvarCronogramaItem(item);
    toast.success(editandoId ? 'Item atualizado!' : 'Item adicionado ao cronograma!');
    setModalOpen(false);
    setEditandoId(null);
    setForm({ titulo: '', aluno_nome: '', data: hojeISO(), horario: '15:00', duracao: 2, observacao: '' });
    carregar();
  }

  function editar(item: CronogramaItem) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo,
      aluno_nome: item.aluno_nome,
      data: item.data,
      horario: item.horario,
      duracao: item.duracao,
      observacao: item.observacao,
    });
    setModalOpen(true);
  }

  async function excluir(id: string) {
    if (!confirm('Remover este item do cronograma?')) return;
    await deletarCronogramaItem(id);
    toast.success('Item removido');
    carregar();
  }

  const itensFiltrados = itens.filter((i) => {
    if (filtroMes !== 'todos' && !i.data.startsWith(filtroMes)) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!i.titulo.toLowerCase().includes(b) &&
          !i.aluno_nome.toLowerCase().includes(b) &&
          !i.observacao.toLowerCase().includes(b)) return false;
    }
    return true;
  });

  const mesesDisponiveis = Array.from(new Set(itens.map((i) => i.data.substring(0, 7)))).sort();

  // Agrupa por data
  const itensPorData = new Map<string, CronogramaItem[]>();
  for (const item of itensFiltrados) {
    if (!itensPorData.has(item.data)) itensPorData.set(item.data, []);
    itensPorData.get(item.data)!.push(item);
  }
  const datasOrdenadas = Array.from(itensPorData.keys()).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-violet-600" /> Cronograma
          </h1>
          <p className="text-sm text-muted-foreground">
            Planejamento das próximas aulas. Use para se organizar — estas aulas <strong>não</strong> contabilizam no dashboard automaticamente.
          </p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => {
              setEditandoId(null);
              setForm({ titulo: '', aluno_nome: '', data: hojeISO(), horario: '15:00', duracao: 2, observacao: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editandoId ? 'Editar Item' : 'Novo Item do Cronograma'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Aula Turma KIDS"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aluno / Turma</Label>
                <Select
                  value={form.aluno_nome}
                  onValueChange={(v) => setForm({ ...form, aluno_nome: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione um aluno/turma..." /></SelectTrigger>
                  <SelectContent>
                    {alunos.map((a) => (
                      <SelectItem key={a.id} value={a.nome}>{a.nome} ({a.tipo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Ou digite manualmente abaixo se não estiver cadastrado</p>
                <Input
                  value={form.aluno_nome}
                  onChange={(e) => setForm({ ...form, aluno_nome: e.target.value })}
                  placeholder="Nome livre..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                  <p className="text-xs text-muted-foreground">{form.data && diaDaSemana(form.data)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Horário</Label>
                  <Input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Duração</Label>
                <Select value={form.duracao?.toString()} onValueChange={(v) => setForm({ ...form, duracao: parseFloat(v) as 1 | 1.5 | 2 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURACOES.map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d}h</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Observação</Label>
                <Textarea
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                  placeholder="Ex: revisão, prova..."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card explicativo */}
      <Card className="bg-violet-50 border-violet-200">
        <CardContent className="p-3 text-xs text-violet-800 flex items-start gap-2">
          <CalendarClock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Cronograma = planejamento.</strong> Use esta página para agendar aulas futuras.
            Quando a aula acontecer, registre-a em <strong>Aulas Dadas</strong> para que entre no dashboard e nos ganhos.
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, aluno ou observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-2 top-2.5">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m} value={m}>{nomeMes(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista agrupada por data */}
      <Card>
        <CardContent className="p-0">
          {itensFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum item no cronograma.</p>
              <p className="text-xs mt-2">Clique em "Novo Item" para planejar suas próximas aulas.</p>
            </div>
          ) : (
            <div className="divide-y">
              {datasOrdenadas.map((data) => {
                const itensDoDia = itensPorData.get(data) || [];
                const [ano, mes, dia] = data.split('-');
                return (
                  <div key={data} className="p-3">
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card">
                      <div className="w-12 h-12 rounded-lg bg-violet-100 text-violet-700 flex flex-col items-center justify-center">
                        <div className="text-lg font-bold leading-none">{dia}</div>
                        <div className="text-[10px] uppercase">{mes}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{diaDaSemana(data)}</div>
                        <div className="text-xs text-muted-foreground">{itensDoDia.length} aula(s) planejada(s)</div>
                      </div>
                    </div>
                    <div className="ml-14 space-y-2">
                      {itensDoDia.map((item) => (
                        <div key={item.id} className="p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{item.titulo}</span>
                                {item.aluno_nome && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                    {item.aluno_nome}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.horario && <span>{item.horario}</span>}
                                {item.horario && ' · '}
                                <span>{item.duracao}h</span>
                                {item.observacao && ` · ${item.observacao}`}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => editar(item)} className="h-8 w-8">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => excluir(item.id)} className="h-8 w-8 text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica de uso */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-3 text-xs text-emerald-800 flex items-start gap-2">
          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            Quando uma aula do cronograma acontecer, vá em <strong>Aulas</strong> e registre-a com o status (presença, falta, etc).
            Aí sim ela entrará no dashboard e nos cálculos de ganhos.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
