'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { listarFechamentosPorProfessor } from '@/lib/db';
import type { Fechamento } from '@/types';
import { formatarMoeda, formatarHoras, nomeMes } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, XCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FechamentosPage() {
  const { professor } = useAuth();
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!professor) return;
    const f = await listarFechamentosPorProfessor(professor.id);
    setFechamentos(f.sort((a, b) => b.mes.localeCompare(a.mes)));
    setCarregando(false);
  }, [professor]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalGeral = fechamentos.reduce((s, f) => s + f.total_ganhos, 0);
  const totalHorasGeral = fechamentos.reduce((s, f) => s + f.total_horas, 0);

  if (carregando) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Fechamentos Mensais</h1>
        <p className="text-sm text-muted-foreground">
          {fechamentos.length} meses fechados · Total: {formatarHoras(totalHorasGeral)} · {formatarMoeda(totalGeral)}
        </p>
      </div>

      {fechamentos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum mês fechado ainda.</p>
            <p className="text-xs mt-2">Vá no Dashboard e clique em "Fechar Mês" no fim de cada mês.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fechamentos.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-br from-emerald-50 to-sky-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{nomeMes(f.mes)}</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <CardDescription>
                  Fechado em {format(new Date(f.fechado_em), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Aulas</div>
                  <div className="font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {f.total_aulas}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Horas</div>
                  <div className="font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatarHoras(f.total_horas)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Presenças</div>
                  <div className="font-bold text-emerald-600">{f.total_presencas}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Faltas</div>
                  <div className="font-bold text-rose-600">{f.total_faltas}</div>
                </div>
                <div className="col-span-2 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">Total ganho</div>
                  <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1">
                    <DollarSign className="w-5 h-5" /> {formatarMoeda(f.total_ganhos).replace('R$', '').trim()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
