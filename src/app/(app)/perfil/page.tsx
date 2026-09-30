'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatarMoeda } from '@/lib/calculations';

export default function PerfilPage() {
  const { professor, atualizarProfessor } = useAuth();
  const [nome, setNome] = useState(professor?.nome || '');
  const [valorHora, setValorHora] = useState(professor?.valor_hora?.toString() || '35');
  const [valorFalta, setValorFalta] = useState(professor?.valor_falta?.toString() || '35');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!professor) return;
    setSalvando(true);
    const vh = parseFloat(valorHora.replace(',', '.'));
    const vf = parseFloat(valorFalta.replace(',', '.'));
    if (isNaN(vh) || isNaN(vf)) {
      toast.error('Valores inválidos');
      setSalvando(false);
      return;
    }
    await atualizarProfessor({
      ...professor,
      nome: nome.trim(),
      valor_hora: vh,
      valor_falta: vf,
    });
    toast.success('Perfil atualizado!');
    setSalvando(false);
  }

  if (!professor) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold">Perfil</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Atualize seus dados e valores cobrados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Dados do Professor</CardTitle>
          <CardDescription className="text-xs">Informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Usuário (não editável)</Label>
              <Input value={professor.username} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor por hora (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorHora}
                  onChange={(e) => setValorHora(e.target.value)}
                  required
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Atual: {formatarMoeda(professor.valor_hora)}/h</p>
              </div>
              <div className="space-y-1.5">
                <Label>Valor por falta (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorFalta}
                  onChange={(e) => setValorFalta(e.target.value)}
                  required
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Geralmente 1h = {formatarMoeda(professor.valor_falta)}</p>
              </div>
            </div>
            <Button type="submit" disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" /> {salvando ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Regras de cálculo</CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm space-y-2">
          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
            <span>Presença VIP 1h:</span>
            <strong>{formatarMoeda(professor.valor_hora * 1)}</strong>
          </div>
          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
            <span>Presença VIP 1,5h:</span>
            <strong>{formatarMoeda(professor.valor_hora * 1.5)}</strong>
          </div>
          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
            <span>Presença VIP 2h:</span>
            <strong>{formatarMoeda(professor.valor_hora * 2)}</strong>
          </div>
          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
            <span>Presença Turma (2h):</span>
            <strong>{formatarMoeda(professor.valor_hora * 2)}</strong>
          </div>
          <div className="flex justify-between items-center p-2 bg-rose-50 rounded">
            <span>Falta (qualquer tipo):</span>
            <strong>{formatarMoeda(professor.valor_falta)} (1h fixa)</strong>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
            <span>Cancelada/Agendada:</span>
            <strong>R$ 0,00</strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
