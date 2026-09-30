'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BookOpen, ArrowRight, ArrowLeft, BarChart3, CalendarClock, ClipboardList,
  Calendar, Users, Users2, DollarSign, Smartphone, Cloud, Shield,
  CheckCircle2, TrendingUp, Star, Coffee, MessageCircle
} from 'lucide-react';

const WHATSAPP_NUMBER = '5511966161611';
const WHATSAPP_MSG = 'Olá sou professor! Gostaria de Contratar o Controle de Aulas Super Inteligente!';

const screenshots = [
  {
    img: '/Controle-de-Horas/images/aulas.png',
    title: 'Tela de Aulas Dadas',
    desc: 'A lista completa das aulas que você já registrou. Cada linha mostra dia da semana, data, horário, duração, status (presença/falta/cancelada) e valor calculado automaticamente.',
    points: [
      'Filtros por mês e por status',
      'Busca por nome do aluno ou conteúdo',
      'Total de aulas, horas e ganhos no topo',
      'Botão de editar e excluir em cada linha',
    ],
  },
  {
    img: '/Controle-de-Horas/images/aulas2.png',
    title: 'Formulário de Nova Aula',
    desc: 'Quando você dá uma aula, é só tocar em "Nova Aula". O formulário já vem com a data de hoje pré-preenchida. Escolha o aluno, horário, duração e status. O sistema calcula o valor na hora.',
    points: [
      'Data padrão é hoje (não precisa digitar)',
      'Alunos ativos e inativos aparecem no seletor',
      'Duração: 1h, 1,5h ou 2h (turma sempre 2h)',
      'Status: presença, falta, cancelada ou agendada',
      'Valor calculado automaticamente em tempo real',
    ],
  },
];

const allFeatures = [
  { icon: BarChart3, title: 'Dashboard cinematográfico', desc: 'Veja KPIs (aulas, horas, ganhos, faltas), gráfico de aulas por dia, pizza de presenças vs faltas, ganhos por semana, top 5 alunos e horas acumuladas. Tudo em uma tela só.', color: 'emerald' },
  { icon: CalendarClock, title: 'Cronograma (planejamento)', desc: 'Aqui você cadastra as aulas que VAI dar. Não afeta o dashboard. Use pra se organizar sem poluir os números. Quando a aula acontece, registra ela em "Aulas Dadas".', color: 'violet' },
  { icon: ClipboardList, title: 'Aulas Dadas (registro)', desc: 'Aqui você lança as aulas que JÁ DEU. É o que conta no dashboard e nos ganhos. Formulário simples e rápido, com data de hoje pré-preenchida.', color: 'emerald' },
  { icon: Calendar, title: 'Calendário visual', desc: 'Mês inteiro visível com cores: 🟢 presença, 🔴 falta, 🟡 agendada, ⚫ cancelada. Dia atual destacado em azul. Toque no dia pra lançar aula direto dele.', color: 'sky' },
  { icon: Users, title: 'Alunos', desc: 'Cadastre alunos VIP (1h, 1,5h ou 2h) e marque como ativo/inativo. Inativos continuam aparecendo no seletor pra você registrar aulas antigas.', color: 'amber' },
  { icon: Users2, title: 'Turmas', desc: 'Crie turmas (TURMA KIDS, TURMA ADOLESCENTES, etc) e vincule alunos a elas. Aulas de turma são sempre 2h e têm valor fixo.', color: 'violet' },
  { icon: DollarSign, title: 'Cálculo automático', desc: 'Presença VIP 1h: R$ 35 • 1,5h: R$ 52,50 • 2h: R$ 70. Turma 2h: R$ 70. Falta: R$ 35 (1h fixa). Tudo configurável no seu perfil.', color: 'emerald' },
  { icon: Smartphone, title: 'Mobile-first', desc: 'Bottom navigation bar no celular (Início, Aulas, Calendário, Alunos, Mais). Modais abrem como bottom-sheet. Safe areas do iPhone respeitadas. PWA — pode adicionar à tela inicial.', color: 'sky' },
  { icon: Cloud, title: 'Sync multi-dispositivo', desc: 'Você lança no celular, em 3 segundos aparece no PC. Não precisa configurar nada — já vem pronto. Token GitHub fica seguro no servidor Cloudflare.', color: 'emerald' },
  { icon: Shield, title: 'Segurança', desc: 'Senhas criptografadas com SHA-256 + salt. Cada professor tem painel isolado. Multi-professor: qualquer um pode se cadastrar e usar.', color: 'rose' },
  { icon: BookOpen, title: 'Fechamento mensal', desc: 'No fim de cada mês, clique em "Fechar Mês". Cria um snapshot imutável (não dá pra editar mais). Histórico completo pra declaração de impostos.', color: 'amber' },
  { icon: TrendingUp, title: 'Top 5 alunos', desc: 'Saiba quem são seus melhores alunos por faturamento. Identifique onde vale a pena focar mais energia.', color: 'violet' },
];

export default function SistemaPage() {
  return (
    <div className="min-h-screen bg-[#0a1410] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-[#0a1410]/90 backdrop-blur-lg border-b border-emerald-900/30">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Controle de Aulas</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-emerald-900/20 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            TOUR PELO SISTEMA
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Veja <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">cada detalhe</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100/70 mb-8">
            Prints reais, sem Photoshop. É exatamente isso que você vai usar no dia a dia.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <MessageCircle className="w-5 h-5 mr-2" /> Tire dúvidas no WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* SCREENSHOTS DETALHADOS */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-20">
            {screenshots.map((s, i) => (
              <div key={i} className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-yellow-500/20 rounded-2xl blur-2xl" />
                    <img
                      src={s.img}
                      alt={s.title}
                      className="relative w-full h-auto rounded-2xl border-2 border-emerald-900/40 shadow-2xl"
                    />
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Print real
                    </div>
                  </div>
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
                    TELA {i + 1}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">{s.title}</h2>
                  <p className="text-lg text-emerald-100/70 mb-6">{s.desc}</p>
                  <ul className="space-y-3">
                    {s.points.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-emerald-100/90">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODAS AS FUNCIONALIDADES */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              RECURSOS COMPLETOS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              12 funcionalidades que <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">vão te poupar tempo</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              Cada uma foi pensada na rotina real de um professor.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFeatures.map((f, i) => {
              const Icon = f.icon;
              const colorMap: Record<string, string> = {
                emerald: 'bg-emerald-500/10 text-emerald-400',
                violet: 'bg-violet-500/10 text-violet-400',
                sky: 'bg-sky-500/10 text-sky-400',
                amber: 'bg-amber-500/10 text-amber-400',
                rose: 'bg-rose-500/10 text-rose-400',
              };
              return (
                <div key={i} className="p-6 rounded-2xl bg-emerald-900/10 border border-emerald-900/40 hover:border-emerald-500/50 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${colorMap[f.color]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-emerald-100/70 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              COMO FUNCIONA
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold">
              Em <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">3 passos</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Cadastre-se</h3>
              <p className="text-sm text-emerald-100/70">Crie sua conta com usuário, senha e nome. Configure seu valor/hora. Pronto — já pode usar.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-emerald-400">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Cadastre alunos e aulas</h3>
              <p className="text-sm text-emerald-100/70">Adicione seus alunos (VIP ou Turma). Lance as aulas que você dá. Tudo é calculado automaticamente.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Acompanhe o dashboard</h3>
              <p className="text-sm text-emerald-100/70">Veja horas, ganhos e faltas em tempo real. No fim do mês, feche com 1 clique. Simples assim.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-yellow-500/10">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <Coffee className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Pronto pra começar?
          </h2>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-xl mx-auto">
            R$ 3,49/mês. 7 dias grátis pra testar. Sem cartão de crédito pra começar. Cancele quando quiser.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 px-8">
                Assinar R$ 3,49/mês <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-emerald-700 text-emerald-100 px-8">
                <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-emerald-900/30 bg-[#0a1410]">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-emerald-100/50">
          <p>© 2026 Controle de Aulas. Professor apoiando professor. ☕</p>
          <p className="mt-1">Feito com 💚 no Brasil • 27 anos de carreira</p>
        </div>
      </footer>
    </div>
  );
}
