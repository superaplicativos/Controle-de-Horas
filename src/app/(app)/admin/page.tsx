'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield, Users, DollarSign, Clock, Search, CheckCircle2, XCircle, Ban, Unlock,
  TrendingUp, Calendar, AlertTriangle, Activity, UserCheck, UserX, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { listarProfessoresAPI, atualizarProfessorAPI } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

interface ProfessorAdmin {
  id?: string;
  username: string;
  nome?: string;
  assinatura_status: string;
  assinatura_id?: string;
  trial_fim?: number;
  bloqueado: boolean;
  is_admin?: boolean;
  criado_em?: number;
}

const STATUS_COLORS_MAP: Record<string, string> = {
  active: '#10b981',
  free_trial: '#f59e0b',
  cancelled: '#6b7280',
  lifetime: '#fbbf24',
  blocked: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  free_trial: 'Teste grátis',
  cancelled: 'Cancelado',
  lifetime: 'Vitalício',
  blocked: 'Bloqueado',
};

export default function AdminPage() {
  const { professor } = useAuth();
  const router = useRouter();
  const [professores, setProfessores] = useState<ProfessorAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const profs = await listarProfessoresAPI();
      setProfessores(profs.map((p: any) => ({
        ...p,
        bloqueado: !!p.bloqueado,
        is_admin: !!p.is_admin,
      })));
    } catch (e) {
      // Fallback: se a API não responder, mostra Guilherme como único
      setProfessores([{
        username: 'guilherme',
        nome: 'Guilherme Miranda',
        assinatura_status: 'lifetime',
        bloqueado: false,
        is_admin: true,
        criado_em: Date.now(),
      }]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!professor) { router.replace('/login'); return; }
    if (!professor.is_admin) { router.replace('/dashboard'); return; }
    carregar();
  }, [professor, router, carregar]);

  async function atualizarProf(username: string, dados: { assinatura_status?: string; bloqueado?: boolean }) {
    try {
      await atualizarProfessorAPI(username, dados);
      toast.success(`${username} atualizado!`);
      carregar();
    } catch (e) {
      toast.error('Erro ao atualizar');
    }
  }

  // Criar usuário manualmente
  const [novoUsername, setNovoUsername] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoSenha, setNovoSenha] = useState('');
  const [criando, setCriando] = useState(false);

  async function criarUsuario() {
    if (!novoUsername.trim() || !novoSenha.trim() || !novoNome.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setCriando(true);
    try {
      const { cadastrarProfessorAPI } = await import('@/lib/api');
      const result = await cadastrarProfessorAPI({
        username: novoUsername.trim().toLowerCase(),
        senha: novoSenha,
        nome: novoNome.trim(),
        valor_hora: 35,
      });
      if (result.ok) {
        // Libera como VIP (free/lifetime)
        await atualizarProfessorAPI(novoUsername.trim().toLowerCase(), { assinatura_status: 'active' });
        toast.success(`Usuário ${novoUsername} criado e liberado!`);
        setNovoUsername('');
        setNovoNome('');
        setNovoSenha('');
        carregar();
      } else {
        toast.error(result.erro || 'Erro ao criar usuário');
      }
    } catch (e) {
      toast.error('Erro ao criar usuário');
    } finally {
      setCriando(false);
    }
  }

  if (!professor || !professor.is_admin) return null;

  // KPIs do CEO
  const stats = {
    total: professores.length,
    ativos: professores.filter(p => p.assinatura_status === 'active').length,
    trial: professores.filter(p => p.assinatura_status === 'free_trial').length,
    cancelados: professores.filter(p => p.assinatura_status === 'cancelled').length,
    bloqueados: professores.filter(p => p.bloqueado).length,
    receita: professores.filter(p => p.assinatura_status === 'active').length * 3.49,
    taxaConversao: professores.length > 0
      ? (professores.filter(p => p.assinatura_status === 'active').length / professores.length * 100)
      : 0,
  };

  const statusData = [
    { name: 'Ativos', value: stats.ativos, cor: '#10b981' },
    { name: 'Teste grátis', value: stats.trial, cor: '#f59e0b' },
    { name: 'Cancelados', value: stats.cancelados, cor: '#6b7280' },
    { name: 'Vitalício', value: professores.filter(p => p.assinatura_status === 'lifetime').length, cor: '#fbbf24' },
  ].filter(d => d.value > 0);

  const filtrados = professores.filter((p) => {
    if (filtroStatus !== 'todos' && p.assinatura_status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!p.username.toLowerCase().includes(b) && !(p.nome || '').toLowerCase().includes(b)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-500" /> Painel do CEO
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Visão geral do SaaS — Controle de Aulas</p>
      </div>

      {/* KPIs do CEO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">Total de professores</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Pagantes</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Em teste grátis</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.trial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Receita mensal</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">R$ {stats.receita.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Conversão (teste → pago)</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-violet-600">{stats.taxaConversao.toFixed(0)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Cancelados</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.cancelados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Bloqueados</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.bloqueados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">Receita potencial (100%)</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-sky-600">R$ {(stats.total * 3.49).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de status */}
      {statusData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Distribuição de assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={(e) => `${e.name}: ${e.value}`}>
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Receita por status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Pagantes', valor: stats.ativos * 3.49 },
                  { name: 'Teste', valor: 0 },
                  { name: 'Cancelados', valor: 0 },
                  { name: 'Potencial', valor: stats.total * 3.49 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Criar usuário manualmente */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" /> Criar Usuário (Manual)
          </CardTitle>
          <CardDescription className="text-xs">
            Crie um professor e libere acesso grátis. Ele terá painel isolado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Usuário (ex: joao)" value={novoUsername} onChange={(e) => setNovoUsername(e.target.value)} />
            <Input placeholder="Nome completo" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            <Input placeholder="Senha" type="password" value={novoSenha} onChange={(e) => setNovoSenha(e.target.value)} />
          </div>
          <Button onClick={criarUsuario} disabled={criando} className="bg-emerald-600 hover:bg-emerald-700">
            {criando ? 'Criando...' : 'Criar e liberar acesso'}
          </Button>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário ou nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="todos">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="free_trial">Em teste</option>
            <option value="cancelled">Cancelados</option>
            <option value="lifetime">Vitalício (dono)</option>
          </select>
          <Button onClick={carregar} variant="outline" size="sm">Atualizar</Button>
        </CardContent>
      </Card>

      {/* Lista de professores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professores ({filtrados.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {carregando ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum professor encontrado. O Worker D1 ainda não foi atualizado — quando atualizar, os professores aparecerão aqui.
            </div>
          ) : (
            <div className="divide-y max-h-[60vh] overflow-y-auto">
              {filtrados.map((p) => (
                <div key={p.username} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{p.nome || p.username}</span>
                      <span className="text-xs text-muted-foreground">@{p.username}</span>
                      {p.is_admin && <Badge className="bg-yellow-500 text-white">Dono</Badge>}
                      <Badge style={{ backgroundColor: STATUS_COLORS_MAP[p.assinatura_status] || '#6b7280' }} className="text-white">
                        {STATUS_LABELS[p.assinatura_status] || p.assinatura_status}
                      </Badge>
                      {p.bloqueado && <Badge className="bg-red-500 text-white">Bloqueado</Badge>}
                    </div>
                    {p.trial_fim && p.assinatura_status === 'free_trial' && (
                      <div className="text-xs text-muted-foreground">
                        Trial acaba em {format(new Date(p.trial_fim), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                    {p.criado_em && (
                      <div className="text-xs text-muted-foreground">
                        Cadastrado em {format(new Date(p.criado_em), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                  {!p.is_admin && (
                    <div className="flex gap-1 flex-wrap">
                      {p.bloqueado ? (
                        <Button size="sm" variant="outline" onClick={() => atualizarProf(p.username, { bloqueado: false })}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50">
                          <Unlock className="w-3 h-3 mr-1" /> Desbloquear
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => atualizarProf(p.username, { bloqueado: true })}
                          className="text-red-600 border-red-300 hover:bg-red-50">
                          <Ban className="w-3 h-3 mr-1" /> Bloquear
                        </Button>
                      )}
                      {p.assinatura_status !== 'active' && (
                        <Button size="sm" variant="outline" onClick={() => atualizarProf(p.username, { assinatura_status: 'active' })}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativar
                        </Button>
                      )}
                      {p.assinatura_status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => atualizarProf(p.username, { assinatura_status: 'cancelled' })}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50">
                          <XCircle className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
