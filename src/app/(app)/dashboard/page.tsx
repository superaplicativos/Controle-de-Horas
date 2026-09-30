'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarAulasPorMes, listarAulasPorProfessor, buscarFechamentoMes } from '@/lib/db';
import { calcularResumoMes, mesAtualRef, nomeMes, mesAnteriorRef, formatarMoeda, formatarHoras } from '@/lib/calculations';
import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, DollarSign, XCircle, TrendingUp, Award, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { criarFechamento } from '@/lib/calculations';
import { salvarFechamento } from '@/lib/db';
import { toast } from 'sonner';

const STATUS_COLORS = {
  presenca: '#10b981',
  falta: '#ef4444',
  cancelada: '#6b7280',
  agendada: '#f59e0b',
};

const STATUS_LABELS = {
  presenca: 'Presença',
  falta: 'Falta',
  cancelada: 'Cancelada',
  agendada: 'Agendada',
};

export default function DashboardPage() {
  const { professor } = useAuth();
  const [mesRef, setMesRef] = useState(mesAtualRef());
  const [aulas, setAulas] = useState<ReturnType<typeof calcularResumoMes> | null>(null);
  const [aulasAnterior, setAulasAnterior] = useState<ReturnType<typeof calcularResumoMes> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [jaFechado, setJaFechado] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  const carregar = useCallback(async () => {
    if (!professor) return;
    setCarregando(true);
    try {
      const aulasMes = await listarAulasPorMes(professor.id, mesRef);
      const mesAnt = mesAnteriorRef(mesRef);
      const aulasMesAnt = await listarAulasPorMes(professor.id, mesAnt);
      const fechamento = await buscarFechamentoMes(professor.id, mesRef);
      setAulas(calcularResumoMes(aulasMes));
      setAulasAnterior(calcularResumoMes(aulasMesAnt));
      setJaFechado(!!fechamento);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [professor, mesRef]);

  useEffect(() => {
    carregar();
  }, [carregar, syncTick]);

  async function handleFecharMes() {
    if (!professor) return;
    if (!confirm(`Confirma o fechamento de ${nomeMes(mesRef)}? Após fechar, as aulas deste mês não poderão mais ser editadas.`)) return;
    try {
      const aulasMes = await listarAulasPorMes(professor.id, mesRef);
      const f = await criarFechamento(professor.id, mesRef, aulasMes);
      await salvarFechamento(f);
      toast.success(`Mês de ${nomeMes(mesRef)} fechado!`);
      setSyncTick((t) => t + 1);
    } catch (e) {
      toast.error('Erro ao fechar mês');
    }
  }

  function navegarMes(direcao: number) {
    const [ano, mes] = mesRef.split('-').map(Number);
    const d = new Date(ano, mes - 1, 1);
    d.setMonth(d.getMonth() + direcao);
    setMesRef(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
  }

  if (carregando || !aulas) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Carregando dashboard...</div>;
  }

  const r = aulas;
  const rAnt = aulasAnterior;

  const calcTend = (atual: number, ant: number) => {
    if (ant === 0) return atual > 0 ? 100 : 0;
    return ((atual - ant) / ant) * 100;
  };

  const statusData = r.aulasPorStatus.map((s) => ({
    name: STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status,
    value: s.total,
    cor: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || '#999',
  }));

  const totalHorasAnt = rAnt?.totalHoras || 0;
  const totalGanhosAnt = rAnt?.totalGanhos || 0;
  const totalAulasAnt = rAnt?.totalAulas || 0;
  const totalFaltasAnt = rAnt?.totalFaltas || 0;

  return (
    <div className="space-y-6">
      {/* Header com mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Olá, {professor?.nome?.split(' ')[0]}! Aqui está seu resumo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navegarMes(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 bg-card border rounded-lg font-semibold text-sm min-w-[180px] text-center">
            {nomeMes(mesRef)}
          </div>
          <Button variant="outline" size="icon" onClick={() => navegarMes(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {jaFechado ? (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fechado
            </span>
          ) : (
            <Button variant="default" size="sm" onClick={handleFecharMes} className="bg-amber-600 hover:bg-amber-700">
              Fechar Mês
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Aulas"
          valor={r.totalAulas.toString()}
          icon={Calendar}
          cor="sky"
          tendencia={calcTend(r.totalAulas, totalAulasAnt)}
        />
        <KpiCard
          titulo="Horas"
          valor={formatarHoras(r.totalHoras)}
          icon={Clock}
          cor="violet"
          tendencia={calcTend(r.totalHoras, totalHorasAnt)}
        />
        <KpiCard
          titulo="Ganhos"
          valor={formatarMoeda(r.totalGanhos)}
          icon={DollarSign}
          cor="emerald"
          tendencia={calcTend(r.totalGanhos, totalGanhosAnt)}
        />
        <KpiCard
          titulo="Faltas"
          valor={r.totalFaltas.toString()}
          icon={XCircle}
          cor="rose"
          tendencia={calcTend(r.totalFaltas, totalFaltasAnt)}
        />
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aulas por dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aulas por dia</CardTitle>
            <CardDescription>Distribuição das aulas ao longo do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={r.aulasPorDia}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelFormatter={(v) => `Dia ${v}`}
                />
                <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Aulas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presenças vs Faltas</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e) => `${e.name}: ${e.value}`}
                    labelLine={false}
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ganhos por semana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ganhos por semana</CardTitle>
            <CardDescription>Evolução semanal do faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            {r.ganhosPorSemana.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={r.ganhosPorSemana}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => formatarMoeda(v)}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top 5 alunos
            </CardTitle>
            <CardDescription>Maiores faturamentos do mês</CardDescription>
          </CardHeader>
          <CardContent>
            {r.topAlunos.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={r.topAlunos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => formatarMoeda(v)}
                  />
                  <Bar dataKey="valor" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Horas acumuladas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horas acumuladas no mês</CardTitle>
          <CardDescription>Total de horas trabalhadas acumuladas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          {r.horasAcumuladas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={r.horasAcumuladas}>
                <defs>
                  <linearGradient id="horasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v}h`} />
                <Area type="monotone" dataKey="horas" stroke="#8b5cf6" strokeWidth={2} fill="url(#horasGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Presenças</div>
            <div className="text-xl font-bold text-emerald-600">{r.totalPresencas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Faltas</div>
            <div className="text-xl font-bold text-rose-600">{r.totalFaltas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Canceladas</div>
            <div className="text-xl font-bold text-gray-500">{r.totalCanceladas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Agendadas</div>
            <div className="text-xl font-bold text-amber-600">{r.totalAgendadas}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
