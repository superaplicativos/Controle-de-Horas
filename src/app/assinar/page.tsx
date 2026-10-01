'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Coffee, Lock, Shield, Clock, AlertCircle } from 'lucide-react';
import { temAcessoLiberado, getMercadoPagoLink } from '@/lib/assinatura';

export default function AssinarPage() {
  const { professor, atualizarProfessor } = useAuth();
  const router = useRouter();
  const [verificando, setVerificando] = useState(false);

  // Guilherme NUNCA fica nesta página — redirect imediato
  useEffect(() => {
    if (!professor) return;
    if (professor.username === 'guilherme' || professor.is_admin || professor.assinatura_status === 'lifetime') {
      router.replace('/dashboard');
      return;
    }
    const acesso = temAcessoLiberado(professor);
    if (acesso.liberado && professor.assinatura_status === 'active') {
      router.replace('/dashboard');
    }
  }, [professor, router]);

  if (!professor) {
    router.replace('/login');
    return null;
  }

  const acesso = temAcessoLiberado(professor);

  async function verificarPagamento() {
    setVerificando(true);
    try {
      // Tenta sincronizar com o Worker
      const { sincronizarAssinatura } = await import('@/lib/assinatura');
      const profAtualizado = await sincronizarAssinatura(professor!);
      if (profAtualizado) {
        await atualizarProfessor(profAtualizado);
        const novoAcesso = temAcessoLiberado(profAtualizado);
        if (novoAcesso.liberado && profAtualizado.assinatura_status === 'active') {
          router.replace('/dashboard');
          return;
        }
      }
      alert('Ainda não identificamos seu pagamento. Se você já pagou, aguarde alguns minutos (o Mercado Pago pode demorar até 5 minutos para confirmar). Se persistir, entre em contato no WhatsApp.');
    } catch (e) {
      alert('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1410] to-[#0f1f17] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Assine o Controle de Aulas</h1>
          <p className="text-emerald-100/70">Professor apoiando professor. Um cafézinho por mês.</p>
        </div>

        {/* Status atual */}
        <Card className="mb-6 border-emerald-700/50 bg-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                {acesso.liberado ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {professor.assinatura_status === 'free_trial' && 'Período de teste'}
                  {professor.assinatura_status === 'active' && 'Assinatura ativa'}
                  {professor.assinatura_status === 'cancelled' && 'Assinatura cancelada'}
                  {professor.assinatura_status === 'blocked' && 'Conta bloqueada'}
                  {professor.assinatura_status === 'lifetime' && 'Acesso vitalício (dono)'}
                </div>
                <div className="text-xs text-emerald-100/60">
                  {acesso.diasRestantesTrial !== undefined && (
                    `${acesso.diasRestantesTrial} dias restantes do teste grátis`
                  )}
                  {acesso.motivo && !acesso.diasRestantesTrial && acesso.motivo}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de plano */}
        <Card className="border-2 border-emerald-500 bg-gradient-to-b from-emerald-900/30 to-transparent shadow-2xl shadow-emerald-500/20 relative mb-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
            PLANO CAFÉ
          </div>
          <CardContent className="p-8">
            <div className="flex items-baseline gap-1 mb-2 justify-center">
              <span className="text-sm text-emerald-100/60">R$</span>
              <span className="text-5xl font-bold bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">3,49</span>
              <span className="text-emerald-100/60">/mês</span>
            </div>
            <p className="text-center text-xs text-emerald-100/50 mb-6">
              no cartão de crédito, recorrência mensal
            </p>

            <ul className="space-y-3 mb-6">
              {[
                'Aulas, alunos e turmas ilimitados',
                'Dashboard com gráficos',
                'Cronograma e calendário',
                'Fechamento mensal automático',
                'Sincronização entre dispositivos',
                'Backup em arquivo .txt',
                'Suporte direto com o desenvolvedor',
                'Sem fidelidade, cancele quando quiser',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-emerald-100/90">{f}</span>
                </li>
              ))}
            </ul>

            {/* Botão de pagamento */}
            <a
              href={getMercadoPagoLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 mb-3"
            >
              Pagar R$ 3,49/mês no Mercado Pago <ArrowRight className="inline w-4 h-4 ml-2" />
            </a>

            <p className="text-xs text-emerald-100/50 text-center">
              Abre em nova aba. Pagamento seguro via Mercado Pago.
            </p>
          </CardContent>
        </Card>

        {/* Já paguei */}
        <Card className="bg-emerald-900/10 border-emerald-900/40 mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Já fez o pagamento?
            </div>
            <p className="text-xs text-emerald-100/60">
              Após pagar no Mercado Pago, clique no botão abaixo. O sistema vai verificar seu pagamento e liberar o acesso.
            </p>
            <Button
              onClick={verificarPagamento}
              disabled={verificando}
              variant="outline"
              className="w-full border-emerald-700 text-emerald-100 hover:bg-emerald-900/30"
            >
              {verificando ? 'Verificando...' : 'Já paguei, verificar acesso'}
            </Button>
          </CardContent>
        </Card>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-emerald-100/40">
          <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pagamento seguro</div>
          <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Dados protegidos</div>
        </div>

        {/* Voltar */}
        <div className="text-center mt-6">
          <a
            href={`https://wa.me/5511966161611?text=${encodeURIComponent('Olá! Tenho dúvida sobre a assinatura do Controle de Aulas')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Dúvidas? Fale no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
