'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { listarAulasPorMes, listarAlunosPorProfessor, salvarAula, buscarFechamentoMes } from '@/lib/db';
import type { Aula, Aluno, DuracaoAula, StatusAula } from '@/types';
import { formatarMoeda, hojeISO, mesAtualRef, nomeMes, diaDaSemana, calcularValorAula, diasDoMes } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { gerarId } from '@/lib/crypto';
import { cn } from '@/lib/utils';
import { useSync } from '@/lib/useSync';
import { useAutoReload } from '@/lib/useAutoReload';

const STATUS_OPCOES = [
  { value: 'presenca', label: 'Presença', cor: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'falta', label: 'Falta', cor: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' },
  { value: 'cancelada', label: 'Cancelada', cor: 'bg-gray-500', badge: 'bg-gray-100 text-gray-700' },
  { value: 'agendada', label: 'Agendada', cor: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
];

const DURACOES: DuracaoAula[] = [1, 1.5, 2];

export default function CalendarioPage() {
  const { professor } = useAuth();
  const router = useRouter();
  const { notificar } = useSync();
  const [mesRef, setMesRef] = useState(mesAtualRef());
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Aula>>({
    aluno_id: '', horario: '15:00', duracao: 2, status: 'presenca', conteudo: '',
  });

  const carregar = useCallback(async () => {
    if (!professor) return;
    const [a, al] = await Promise.all([
      listarAulasPorMes(professor.id, mesRef),
      listarAlunosPorProfessor(professor.id),
    ]);
    setAulas(a);
    setAlunos(al.filter((x) => x.ativo));
  }, [professor, mesRef]);

  useEffect(() => { carregar(); }, [carregar]);
  useAutoReload(carregar);

  function navegarMes(direcao: number) {
    const [ano, mes] = mesRef.split('-').map(Number);
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() + direcao);
    setMesRef(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
  }

  function abrirDia(data: string) {
    setDiaSelecionado(data);
    setForm({ aluno_id: '', horario: '15:00', duracao: 2, status: 'presenca', conteudo: '' });
    setModalOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor || !diaSelecionado) return;
    if (!form.aluno_id) { toast.error('Selecione um aluno'); return; }

    const aluno = alunos.find((a) => a.id === form.aluno_id);
    if (!aluno) return;

    const fechamento = await buscarFechamentoMes(professor.id, mesRef);
    if (fechamento) { toast.error(`Mês de ${nomeMes(mesRef)} já fechado.`); return; }

    const duracaoFinal: DuracaoAula = aluno.tipo === 'turma' ? 2 : (form.duracao || 1);
    const valor = calcularValorAula(form.status as StatusAula, duracaoFinal, aluno.tipo, professor.valor_hora, professor.valor_falta);
    const aula: Aula = {
      id: gerarId(),
      professor_id: professor.id,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      aluno_tipo: aluno.tipo,
      data: diaSelecionado,
      horario: form.horario || '',
      duracao: duracaoFinal,
      status: form.status as StatusAula,
      conteudo: form.conteudo || '',
      valor,
      mes_ref: mesRef,
      criado_em: Date.now(),
    };
    await salvarAula(aula);
    toast.success('Aula adicionada no calendário!');
    notificar();
    setModalOpen(false);
    setDiaSelecionado(null);
    carregar();
  }

  // Constroi grid do calendário
  const [ano, mes] = mesRef.split('-').map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const totalDias = diasDoMes(mesRef);
  const hoje = hojeISO();
  const dias: (number | null)[] = [];
  for (let i = 0; i < primeiroDia; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);

  const totalMes = aulas.reduce((s, a) => s + a.valor, 0);
  const horasMes = aulas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Calendário</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{aulas.length} aulas · {horasMes.toFixed(1)}h · {formatarMoeda(totalMes)}</p>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navegarMes(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-card border rounded-lg font-semibold text-xs sm:text-sm text-center flex-1 sm:min-w-[180px]">{nomeMes(mesRef)}</div>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navegarMes(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs">
        {STATUS_OPCOES.map((s) => (
          <div key={s.value} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full', s.cor)} />
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sky-500" />
          <span className="text-muted-foreground">Hoje</span>
        </div>
      </div>

      {/* Calendário grid */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
              <div key={idx} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1 sm:py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia, idx) => {
              if (dia === null) return <div key={idx} />;
              const dataISO = `${mesRef}-${dia.toString().padStart(2, '0')}`;
              const aulasDia = aulas.filter((a) => a.data === dataISO);
              const isHoje = dataISO === hoje;
              return (
                <button
                  key={idx}
                  onClick={() => abrirDia(dataISO)}
                  className={cn(
                    'min-h-[52px] sm:min-h-[100px] p-1 sm:p-1.5 rounded-lg border text-left hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors',
                    isHoje ? 'border-sky-400 bg-sky-50' : 'border-border'
                  )}
                >
                  <div className={cn('text-[10px] sm:text-xs font-bold mb-0.5', isHoje ? 'text-sky-600' : 'text-foreground')}>{dia}</div>
                  <div className="space-y-0.5">
                    {aulasDia.slice(0, 2).map((a) => {
                      const op = STATUS_OPCOES.find((s) => s.value === a.status);
                      return (
                        <div key={a.id} className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px]">
                          <div className={cn('w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0', op?.cor)} />
                          <span className="truncate text-muted-foreground">{a.aluno_nome}</span>
                        </div>
                      );
                    })}
                    {aulasDia.length > 2 && (
                      <div className="text-[8px] sm:text-[10px] text-muted-foreground">+{aulasDia.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {diaSelecionado && diaDaSemana(diaSelecionado)}, {diaSelecionado?.split('-')[2]}/{diaSelecionado?.split('-')[1]}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Aluno / Turma</Label>
              <Select value={form.aluno_id} onValueChange={(v) => setForm({ ...form, aluno_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome} ({a.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Horário</Label>
                <Input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duração</Label>
                <Select value={form.duracao?.toString()} onValueChange={(v) => setForm({ ...form, duracao: parseFloat(v) as DuracaoAula })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURACOES.map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d}h</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={2} placeholder="Ex: Gramática" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
