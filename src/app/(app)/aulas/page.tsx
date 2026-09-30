'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarAulasPorProfessor, listarAlunosPorProfessor, salvarAula, deletarAula, buscarFechamentoMes } from '@/lib/db';
import type { Aula, Aluno, DuracaoAula, StatusAula } from '@/types';
import { formatarMoeda, formatarHoras, hojeISO, mesRefDeData, diaDaSemana, calcularValorAula } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { gerarId } from '@/lib/crypto';
import { mesAtualRef } from '@/lib/calculations';
import { useSync } from '@/lib/useSync';
import { useAutoReload } from '@/lib/useAutoReload';
import { cn } from '@/lib/utils';

const STATUS_OPCOES: { value: StatusAula; label: string; cor: string }[] = [
  { value: 'presenca', label: 'Presença', cor: 'bg-emerald-100 text-emerald-700' },
  { value: 'falta', label: 'Falta', cor: 'bg-rose-100 text-rose-700' },
  { value: 'cancelada', label: 'Cancelada', cor: 'bg-gray-100 text-gray-600' },
  { value: 'agendada', label: 'Agendada', cor: 'bg-amber-100 text-amber-700' },
];

const DURACOES: DuracaoAula[] = [1, 1.5, 2];

export default function AulasPage() {
  const { professor } = useAuth();
  const { notificar } = useSync();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroMes, setFiltroMes] = useState(mesAtualRef());
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Aula>>({
    aluno_id: '',
    data: hojeISO(),
    horario: '15:00',
    duracao: 2,
    status: 'presenca',
    conteudo: '',
  });

  const carregar = useCallback(async () => {
    if (!professor) return;
    const [todas, al] = await Promise.all([
      listarAulasPorProfessor(professor.id),
      listarAlunosPorProfessor(professor.id),
    ]);
    setAulas(todas.sort((a, b) => b.data.localeCompare(a.data) || b.criado_em - a.criado_em));
    // Mostra TODOS os alunos (ativos + inativos) pra poder registrar aula de quem foi inativado
    setAlunos(al.sort((a, b) => {
      // Ativos primeiro, depois inativos, alfabético dentro de cada grupo
      if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    }));
  }, [professor]);

  useEffect(() => { carregar(); }, [carregar]);
  useAutoReload(carregar);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor) return;
    if (!form.aluno_id) { toast.error('Selecione um aluno/turma'); return; }
    if (!form.data) { toast.error('Selecione a data'); return; }

    const aluno = alunos.find((a) => a.id === form.aluno_id);
    if (!aluno) { toast.error('Aluno inválido'); return; }

    // Trava edição de mês já fechado
    const mesRef = mesRefDeData(form.data);
    const fechamento = await buscarFechamentoMes(professor.id, mesRef);
    if (fechamento) {
      toast.error(`O mês de ${mesRef} já foi fechado. Não é possível editar.`);
      return;
    }

    // Para VIP, duração pode ser 1, 1.5 ou 2; para turma, sempre 2
    const duracaoFinal: DuracaoAula = aluno.tipo === 'turma' ? 2 : (form.duracao || 1);
    const valor = calcularValorAula(form.status as StatusAula, duracaoFinal, aluno.tipo, professor.valor_hora, professor.valor_falta);

    const aula: Aula = {
      id: editandoId || gerarId(),
      professor_id: professor.id,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      aluno_tipo: aluno.tipo,
      data: form.data!,
      horario: form.horario || '',
      duracao: duracaoFinal,
      status: form.status as StatusAula,
      conteudo: form.conteudo || '',
      valor,
      mes_ref: mesRef,
      criado_em: Date.now(),
    };

    await salvarAula(aula);
    toast.success(editandoId ? 'Aula atualizada!' : 'Aula registrada!');
    notificar();
    setModalOpen(false);
    setEditandoId(null);
    setForm({ aluno_id: '', data: hojeISO(), horario: '15:00', duracao: 2, status: 'presenca', conteudo: '' });
    carregar();
  }

  function abrirEditar(aula: Aula) {
    setEditandoId(aula.id);
    setForm({
      aluno_id: aula.aluno_id,
      data: aula.data,
      horario: aula.horario,
      duracao: aula.duracao,
      status: aula.status,
      conteudo: aula.conteudo,
    });
    setModalOpen(true);
  }

  function abrirNova() {
    setEditandoId(null);
    setForm({ aluno_id: '', data: hojeISO(), horario: '15:00', duracao: 2, status: 'presenca', conteudo: '' });
    setModalOpen(true);
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta aula?')) return;
    await deletarAula(id);
    toast.success('Aula excluída');
    notificar();
    carregar();
  }

  const aulasFiltradas = aulas.filter((a) => {
    if (filtroMes !== 'todos' && a.mes_ref !== filtroMes) return false;
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!a.aluno_nome.toLowerCase().includes(b) && !a.conteudo.toLowerCase().includes(b)) return false;
    }
    return true;
  });

  const totalMes = aulasFiltradas.reduce((s, a) => s + a.valor, 0);
  const horasMes = aulasFiltradas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);

  // Lista de meses disponíveis para filtro
  const mesesDisponiveis = Array.from(new Set(aulas.map((a) => a.mes_ref))).sort().reverse();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="min-w-0 w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold">Aulas Dadas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {aulasFiltradas.length} aulas · {formatarHoras(horasMes)} · {formatarMoeda(totalMes)}
          </p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNova} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editandoId ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Aluno / Turma</Label>
                <Select value={form.aluno_id} onValueChange={(v) => setForm({ ...form, aluno_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {alunos.map((a) => (
                      <SelectItem key={a.id} value={a.id} className={cn('flex items-center', !a.ativo && 'opacity-60')}>
                        <span className="truncate">{a.nome}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{a.tipo}</span>
                        {!a.ativo && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">inativo</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {alunos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Cadastre alunos primeiro na aba Alunos.</p>
                )}
                <p className="text-[11px] text-muted-foreground">Mostrando ativos e inativos. Inativos aparecem mais claros.</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Duração</Label>
                  <Select
                    value={form.duracao?.toString()}
                    onValueChange={(v) => setForm({ ...form, duracao: parseFloat(v) as DuracaoAula })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURACOES.map((d) => (
                        <SelectItem key={d} value={d.toString()}>{formatarHoras(d)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Turma sempre 2h</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusAula })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPCOES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Conteúdo</Label>
                <Textarea
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  placeholder="Ex: Gramática, leitura..."
                  rows={2}
                />
              </div>

              {form.aluno_id && form.status && form.data && (() => {
                const aluno = alunos.find((a) => a.id === form.aluno_id);
                if (!aluno) return null;
                const duracaoFinal = aluno.tipo === 'turma' ? 2 : (form.duracao || 1);
                const valor = calcularValorAula(form.status as StatusAula, duracaoFinal, aluno.tipo, professor?.valor_hora || 35, professor?.valor_falta || 35);
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                    <div className="flex justify-between"><span>Valor calculado:</span><strong>{formatarMoeda(valor)}</strong></div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{professor?.nome}</span>
                      <span>R$ {professor?.valor_hora}/h</span>
                    </div>
                  </div>
                );
              })()}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 flex flex-col gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno ou conteúdo..."
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
          <div className="grid grid-cols-2 gap-2">
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {mesesDisponiveis.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                {STATUS_OPCOES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            {aulasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma aula encontrada. Clique em "Nova Aula" para começar.
              </div>
            ) : (
              <div className="divide-y">
                {aulasFiltradas.map((a) => {
                  const statusOp = STATUS_OPCOES.find((s) => s.value === a.status);
                  return (
                    <div key={a.id} className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-muted/30">
                      <div className="text-center min-w-[44px] sm:min-w-[56px]">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">{diaDaSemana(a.data)}</div>
                        <div className="text-base sm:text-lg font-bold">{a.data.split('-')[2]}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">{a.data.split('-')[1]}/{a.data.split('-')[0].slice(2)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{a.aluno_nome}</span>
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.aluno_tipo}</span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                          {a.horario} · {formatarHoras(a.duracao)}
                          {a.conteudo && ` · ${a.conteudo}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${statusOp?.cor} whitespace-nowrap`}>{statusOp?.label}</div>
                        <div className="font-bold text-xs sm:text-sm mt-1">{formatarMoeda(a.valor)}</div>
                      </div>
                      <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(a)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => excluir(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
