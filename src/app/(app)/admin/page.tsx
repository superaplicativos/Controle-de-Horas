'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Users, DollarSign, Clock, Search, CheckCircle2, XCircle, Ban, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { WORKER_URL, API_SECRET } from '@/lib/assinatura';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessorAdmin {
  username: string;
  nome?: string;
  assinatura_status: string;
  trial_fim?: number;
  bloqueado: boolean;
  is_admin?: boolean;
}

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
      const resp = await fetch(`${WORKER_URL}/admin/professores`, {
        headers: {
          'Authorization': `Bearer ${API_SECRET}`,
        },
      });
      if (!resp.ok) {
        toast.error('Erro ao carregar professores');
        return;
      }
      const data = await resp.json();
      setProfessores(data.professores || []);
    } catch (e) {
      toast.error('Erro ao carregar professores');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!professor) {
      router.replace('/login');
      return;
    }
    if (!professor.is_admin) {
      router.replace('/dashboard');
      return;
    }
    carregar();
  }, [professor, router, carregar]);

  async function atualizarProfessor(username: string, dados: { assinatura_status?: string; bloqueado?: boolean }) {
    try {
      const resp = await fetch(`${WORKER_URL}/admin/professor/${username}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      if (!resp.ok) {
        toast.error('Erro ao atualizar professor');
        return;
      }
      toast.success(`Professor ${username} atualizado!`);
      carregar();
    } catch (e) {
      toast.error('Erro ao atualizar professor');
    }
  }

  if (!professor || !professor.is_admin) {
    return null;
  }

  const filtrados = professores.filter((p) => {
    if (filtroStatus !== 'todos' && p.assinatura_status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!p.username.toLowerCase().includes(b) && !(p.nome || '').toLowerCase().includes(b)) return false;
    }
    return true;
  });

  const stats = {
    total: professores.length,
    ativos: professores.filter(p => p.assinatura_status === 'active').length,
    trial: professores.filter(p => p.assinatura_status === 'free_trial').length,
    bloqueados: professores.filter(p => p.bloqueado).length,
    receita: professores.filter(p => p.assinatura_status === 'active').length * 3.49,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-500" /> Painel Administrativo
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie professores e assinaturas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Ativos</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Em teste</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.trial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Receita/mês</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">R$ {stats.receita.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

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
            <option value="blocked">Bloqueados</option>
          </select>
          <Button onClick={carregar} variant="outline" size="sm">
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* Lista de professores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professores cadastrados</CardTitle>
          <CardDescription>{filtrados.length} de {professores.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {carregando ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum professor encontrado.</div>
          ) : (
            <div className="divide-y max-h-[60vh] overflow-y-auto">
              {filtrados.map((p) => (
                <div key={p.username} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{p.nome || p.username}</span>
                      <span className="text-xs text-muted-foreground">@{p.username}</span>
                      {p.is_admin && (
                        <Badge className="bg-yellow-500 text-white">Dono</Badge>
                      )}
                      <StatusBadge status={p.assinatura_status} bloqueado={p.bloqueado} />
                    </div>
                    {p.trial_fim && p.assinatura_status === 'free_trial' && (
                      <div className="text-xs text-muted-foreground">
                        Trial termina em {format(new Date(p.trial_fim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                  {!p.is_admin && (
                    <div className="flex gap-1 flex-wrap">
                      {p.bloqueado ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarProfessor(p.username, { bloqueado: false })}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Unlock className="w-3 h-3 mr-1" /> Desbloquear
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarProfessor(p.username, { bloqueado: true })}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Ban className="w-3 h-3 mr-1" /> Bloquear
                        </Button>
                      )}
                      {p.assinatura_status !== 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarProfessor(p.username, { assinatura_status: 'active' })}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativar
                        </Button>
                      )}
                      {p.assinatura_status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarProfessor(p.username, { assinatura_status: 'cancelled' })}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
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

function StatusBadge({ status, bloqueado }: { status: string; bloqueado?: boolean }) {
  if (bloqueado) {
    return <Badge className="bg-red-500 text-white">Bloqueado</Badge>;
  }
  const map: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-500 text-white', label: 'Ativo' },
    free_trial: { color: 'bg-amber-500 text-white', label: 'Teste grátis' },
    cancelled: { color: 'bg-gray-500 text-white', label: 'Cancelado' },
    lifetime: { color: 'bg-yellow-500 text-white', label: 'Vitalício' },
    blocked: { color: 'bg-red-500 text-white', label: 'Bloqueado' },
  };
  const s = map[status] || { color: 'bg-gray-300', label: status };
  return <Badge className={s.color}>{s.label}</Badge>;
}
