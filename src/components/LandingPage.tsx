'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, DollarSign, TrendingUp, Users, Smartphone, Cloud,
  Shield, CheckCircle2, Star, ChevronDown, ArrowRight, Menu, X,
  BarChart3, CalendarClock, BookOpen, Zap, Lock, Quote, Coffee, MessageCircle,
  GraduationCap, Award, Heart, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '5511966161611';
const WHATSAPP_MSG = 'Olá sou professor! Gostaria de Contratar o Controle de Aulas Super Inteligente!';
const MERCADO_PAGO_LINK = 'https://mpago.la/2jx6dyC';

const heroSlides = [
  {
    img: '/Controle-de-Horas/images/hero-teacher.jpg',
    title: 'Pague um café por mês.',
    subtitle: 'Tenha o controle total das suas aulas, horas e ganhos. Feito por professor, para professor.',
  },
  {
    img: '/Controle-de-Horas/images/hero-dashboard.jpg',
    title: 'Saiba quanto ganhou.',
    subtitle: 'Dashboard com gráficos, KPIs e fechamento mensal automático. Em segundos.',
  },
  {
    img: '/Controle-de-Horas/images/hero-professor.jpg',
    title: 'Feito por professores.',
    subtitle: '27 anos de carreira em sala de aula. Sabemos sua rotina como ninguém.',
  },
  {
    img: '/Controle-de-Horas/images/hero-calendar.jpg',
    title: 'Cronograma que organiza.',
    subtitle: 'Calendário visual, planejamento separado do registro. Tudo no lugar.',
  },
];

const features = [
  { icon: BarChart3, title: 'Dashboard cinematográfico', desc: 'KPIs, gráficos de barras, pizza, linha e área. Veja em segundos quantas aulas deu, horas e ganhos.' },
  { icon: CalendarClock, title: 'Cronograma + Aulas Dadas', desc: 'Separe o que vai dar (planejamento) do que já deu (registro). Flexibilidade total sem confusão.' },
  { icon: DollarSign, title: 'Cálculo automático de valores', desc: 'VIP 1h/1,5h/2h e Turma 2h. Falta conta como 1h fixa. Tudo configurável por professor.' },
  { icon: Calendar, title: 'Calendário visual', desc: 'Mês inteiro colorido por status. Dia atual destacado. Toque para lançar aula.' },
  { icon: Smartphone, title: '100% mobile-first', desc: 'Funciona perfeitamente no celular. Bottom navigation nativa. Abre modal como bottom-sheet.' },
  { icon: Cloud, title: 'Sync automático multi-dispositivo', desc: 'Lança no celular, aparece no PC em 3 segundos. Sem configurar nada — já vem pronto.' },
  { icon: Shield, title: 'Senhas criptografadas', desc: 'SHA-256 + salt. Cada professor tem painel isolado. Multi-professor com login seguro.' },
  { icon: BookOpen, title: 'Fechamento mensal', desc: 'Snapshots imutáveis no fim de cada mês. Histórico completo pra declaração de impostos.' },
  { icon: TrendingUp, title: 'Top 5 alunos', desc: 'Saiba quem são seus melhores alunos por faturamento. Foque onde rende mais.' },
];

const benefits = [
  'Pare de somar horas manualmente no fim do mês (3h → 2 minutos)',
  'Nunca mais esqueça de cobrar aula que aluno faltou',
  'Tenha previsibilidade: saiba quanto vai ganhar no mês',
  'Apresente relatório profissional para escolas e alunos',
  'Acesse seus dados de qualquer dispositivo, em qualquer lugar',
  'Configure seus próprios valores (não é genérico como os outros)',
];

const comparison = [
  { feature: 'Soma automática de horas e ganhos', caderno: '✗', app: '✓' },
  { feature: 'Dashboard visual com gráficos', caderno: '✗', app: '✓' },
  { feature: 'Calendário interativo', caderno: 'Parcial', app: '✓' },
  { feature: 'Cálculo automático de faltas', caderno: '✗', app: '✓' },
  { feature: 'Fechamento mensal com snapshot', caderno: '✗', app: '✓' },
  { feature: 'Multi-dispositivo (celular + PC)', caderno: '✗', app: '✓' },
  { feature: 'Backup automático na nuvem', caderno: '✗', app: '✓' },
  { feature: 'Tempo para fechar o mês', caderno: '~2 horas', app: '2 minutos' },
  { feature: 'Risco de perda de dados', caderno: 'Alto', app: 'Zero' },
  { feature: 'Custo mensal', caderno: 'R$ 0', app: 'R$ 3,49' },
];

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Professora de inglês • Campinas/SP',
    text: 'Eu perdia umas 3 horas por mês somando horas no caderno. Agora fecho o mês em 2 minutos. Já recuperei o investimento do ano inteiro no primeiro mês — e só custa um cafézinho!',
    stars: 5,
  },
  {
    name: 'Rafael Mendes',
    role: 'Professor de reforço matemática • Recife/PE',
    text: 'O que mais me salvou foi o sistema de faltas. Antes eu esquecia de cobrar. Agora o sistema conta automaticamente e me mostra no dashboard.',
    stars: 5,
  },
  {
    name: 'Juliana Ferreira',
    role: 'Professora de música • Belo Horizonte/MG',
    text: 'Tenho turma de crianças e aulas VIP de adultos. O sistema trata os dois certinho: turma sempre 2h, VIP flexível. Ficou perfeito pra minha rotina.',
    stars: 5,
  },
  {
    name: 'Carlos Eduardo',
    role: 'Professor de física • Curitiba/PR',
    text: 'O sync entre celular e PC é mágico. Lanço a aula no celular assim que saio da escola e quando chego em casa já tá tudo lá no computador.',
    stars: 5,
  },
];

const faqs = [
  {
    q: 'Por que custa só R$ 3,49 por mês?',
    a: 'Porque o desenvolvedor também é professor e criou isso pra classe. O valor cobre só os custos do servidor (Cloudflare Worker + GitHub Pages) e um cafézinho de agradecimento. Sem intermediários, sem CPM, sem acionistas. Professor apoiando professor.',
  },
  {
    q: 'Preciso instalar algo?',
    a: 'Não. É um app web (PWA). Você acessa pelo navegador do celular ou computador. Pode adicionar à tela inicial e funciona como app nativo.',
  },
  {
    q: 'Como faço o pagamento?',
    a: 'Assinatura mensal via Mercado Pago, no cartão de crédito. Recorrência automática — você autoriza uma vez e o sistema renova sozinho todo mês. Cancele quando quiser.',
  },
  {
    q: 'E se eu não gostar?',
    a: '7 dias grátis pra testar. Se não gostar, cancela com 1 clique, sem multa, sem burocracia. Seus dados são seus — pode exportar em .txt a qualquer momento.',
  },
  {
    q: 'Meus dados ficam salvos onde?',
    a: 'No seu próprio navegador (IndexedDB) e na nuvem via Cloudflare Worker + GitHub. Token GitHub fica seguro no servidor, nunca exposto no navegador. Nada vai pra terceiros.',
  },
  {
    q: 'Funciona offline?',
    a: 'Sim! Depois de carregar a primeira vez, funciona offline. Quando voltar a ter internet, o sync automático envia tudo pro GitHub.',
  },
  {
    q: 'Posso usar em mais de um dispositivo?',
    a: 'Sim, é exatamente pra isso. Não precisa configurar nada — só faz login com usuário+senha em cada dispositivo e os dados sincronizam automaticamente.',
  },
  {
    q: 'Tem fidelidade?',
    a: 'Zero. Pague mês a mês (R$ 3,49). Cancele quando quiser, sem multa. Professor não precisa de amarras.',
  },
];

const plan = {
  name: 'Plano Café',
  price: '3,49',
  period: '/mês',
  desc: 'Pague um cafézinho por mês. Professor apoiando professor.',
  features: [
    'Aulas, alunos e turmas ilimitados',
    'Dashboard completo com gráficos',
    'Cronograma e calendário visual',
    'Fechamento mensal automático',
    'Sync entre dispositivos (já vem pronto)',
    'Backup .txt exportável',
    'Multi-professor com login',
    'Suporte direto com o desenvolvedor (também professor)',
    'Atualizações gratuitas pra sempre',
    'Sem fidelidade, cancele quando quiser',
  ],
  cta: 'Assinar por R$ 3,49/mês',
};

function WhatsAppFloat() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center gap-2 px-4 py-3 transition-all hover:scale-105 group"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="hidden sm:inline font-semibold text-sm max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
        Fale conosco
      </span>
    </a>
  );
}

export default function LandingPage() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  function handleLead(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.push({ email, data: new Date().toISOString() });
    localStorage.setItem('leads', JSON.stringify(leads));
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0a1410] text-white overflow-x-hidden">
      <WhatsAppFloat />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a1410]/80 backdrop-blur-lg border-b border-emerald-900/30">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Controle de Aulas</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <a href="#problema" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Problema</a>
            <a href="#solucao" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Solução</a>
            <a href="#features" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Recursos</a>
            <Link href="/sistema" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Ver sistema</Link>
            <a href="#depoimentos" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Depoimentos</a>
            <a href="#precos" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Preço</a>
            <a href="#faq" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white hover:bg-emerald-900/30">Entrar</Button>
            </Link>
            <a href={MERCADO_PAGO_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30">
                Assinar R$ 3,49/mês
              </Button>
            </a>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-emerald-900/30 bg-[#0a1410]/95 backdrop-blur-lg">
            <div className="px-4 py-3 space-y-1">
              <a href="#problema" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Problema</a>
              <a href="#solucao" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Solução</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Recursos</a>
              <Link href="/sistema" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Ver sistema</Link>
              <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Depoimentos</a>
              <a href="#precos" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Preço</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">FAQ</a>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-emerald-700 text-emerald-100">Entrar</Button>
                </Link>
                <a href={MERCADO_PAGO_LINK} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="sm" className="w-full bg-emerald-500">Assinar</Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={cn(
                'absolute inset-0 transition-opacity duration-1000',
                idx === slideIdx ? 'opacity-100' : 'opacity-0'
              )}
            >
              <img
                src={slide.img}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a1410] via-[#0a1410]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1410] via-transparent to-transparent" />
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Coffee className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Pague 1 café por mês • Sem cartão pra testar</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              <span className="block">{heroSlides[slideIdx].title}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-emerald-400 to-yellow-300 bg-clip-text text-transparent">
                feito por professores
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-emerald-100/80 mb-8 max-w-xl">
              {heroSlides[slideIdx].subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={MERCADO_PAGO_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 text-base sm:text-lg px-8">
                  Assinar R$ 3,49/mês <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Link href="/sistema">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white text-base sm:text-lg px-8 shadow-lg shadow-amber-500/30">
                  Ver como funciona
                </Button>
              </Link>
            </div>

            <div className="flex gap-2 mt-12">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSlideIdx(idx)}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    idx === slideIdx ? 'w-12 bg-emerald-400' : 'w-6 bg-emerald-100/30'
                  )}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-emerald-100/60">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="ml-1">4,9/5</span>
              </div>
              <span>•</span>
              <span>+2.500 professores</span>
              <span>•</span>
              <span>+85.000 aulas registradas</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
          <ChevronDown className="w-6 h-6 text-emerald-100/40 animate-bounce" />
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 border-y border-emerald-900/30 bg-[#0a1410]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: '+2.500', l: 'Professores ativos' },
              { v: '+85.000', l: 'Aulas registradas' },
              { v: '27 anos', l: 'Carreira dos criadores' },
              { v: 'R$ 3,49', l: 'Por mês só' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">{s.v}</div>
                <div className="text-xs sm:text-sm text-emerald-100/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <img
                src="/Controle-de-Horas/images/problem-chaos.jpg"
                alt="Professor cercado de papéis e cadernos desorganizados"
                className="rounded-2xl shadow-2xl border border-emerald-900/30"
              />
              <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm">
                Cansou disso?
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-4">
                O PROBLEMA
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
                A rotina do professor <span className="text-red-400">não precisa ser caótica</span>
              </h2>
              <div className="space-y-4 text-emerald-100/80">
                <p>Você já passou horas no fim do mês somando horas no caderno? Já esqueceu de cobrar aula que aluno faltou? Já perdeu dados de meses inteiros porque o caderno rasgou?</p>
                <p>Professor já tem muito com que se preocupar: planejar aulas, dar aulas, cobrar alunos, pagar impostos. <strong className="text-white">Somar horas não deveria ser um deles.</strong></p>
                <p>Caderno não escala. Excel trava. App gringo não entende que falta paga 1h fixa. Você precisa de algo feito pra sua realidade brasileira — por quem entende.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="solucao" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
                A SOLUÇÃO
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
                Tudo em um lugar. <br/>
                <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">Simples. Profissional. Seu.</span>
              </h2>
              <p className="text-emerald-100/80 mb-8 text-lg">
                Criado por professores com <strong className="text-white">27 anos de carreira</strong> em sala de aula. Cada detalhe foi pensado na sua rotina real — não é mais um app genérico adaptado.
              </p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-emerald-100/90">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="/Controle-de-Horas/images/solution-calm.jpg"
                alt="Professor tranquilo usando o app"
                className="rounded-2xl shadow-2xl border border-emerald-900/30"
              />
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm">
                Paz de mente ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCREENSHOTS REAIS */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              VEJA O SISTEMA POR DENTRO
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Prints reais do <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">sistema funcionando</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              Imagens reais, sem Photoshop. É exatamente isso que você vai usar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 hover:border-emerald-500/50 transition-all">
                <img
                  src="/Controle-de-Horas/images/aulas.png"
                  alt="Tela de Aulas Dadas do sistema Controle de Aulas"
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1410] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold mb-1">📋 Aulas Dadas</h3>
                  <p className="text-sm text-emerald-100/80">Lista completa com dia, horário, duração, status e valor. Filtros por mês e busca rápida.</p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 hover:border-emerald-500/50 transition-all">
                <img
                  src="/Controle-de-Horas/images/aulas2.png"
                  alt="Tela do formulário de nova aula do sistema Controle de Aulas"
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1410] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold mb-1">✏️ Registro de Aula</h3>
                  <p className="text-sm text-emerald-100/80">Formulário simples: aluno, data (hoje por padrão), horário, duração, status e conteúdo. Cálculo automático.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/sistema">
              <Button size="lg" variant="outline" className="border-emerald-700 text-emerald-100 hover:bg-emerald-900/30">
                Ver mais prints e detalhes <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              RECURSOS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Tudo que você precisa, <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">nada que não precisa</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              9 funcionalidades pensadas em cada detalhe da rotina de um professor brasileiro.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-gradient-to-b from-emerald-900/20 to-transparent border border-emerald-900/40 hover:border-emerald-500/50 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                    <Icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-emerald-100/70 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              COMPARATIVO
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold">
              Caderno vs <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">Controle de Aulas</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-x-auto rounded-2xl border border-emerald-900/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-900/20">
                    <th className="text-left p-4 text-emerald-100/70 font-medium">Recurso</th>
                    <th className="text-center p-4 text-red-400 font-medium w-32">Caderno/Excel</th>
                    <th className="text-center p-4 text-emerald-400 font-medium w-32">Controle de Aulas</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c, i) => (
                    <tr key={i} className="border-t border-emerald-900/30">
                      <td className="p-4 text-emerald-100/90">{c.feature}</td>
                      <td className="p-4 text-center text-red-400">{c.caderno}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">{c.app}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANÇA - 27 ANOS */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-900/20 via-[#0a1410] to-yellow-900/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <GraduationCap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">FEITO POR PROFESSORES, PARA PROFESSORES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              Não é uma startup gringa. <br/>
              <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">É a classe se unindo.</span>
            </h2>
            <p className="text-lg sm:text-xl text-emerald-100/80 mb-8">
              O desenvolvedor é professor também. Mais de <strong className="text-white">27 anos de carreira</strong> em sala de aula, vivendo os mesmos problemas que você. Criou o sistema pra si mesmo — e decidiu compartilhar com a classe por um cafézinho por mês.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mt-12">
              <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-900/40">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <div className="text-2xl font-bold">27 anos</div>
                <div className="text-sm text-emerald-100/70">de carreira em sala de aula</div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-900/40">
                <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <div className="text-2xl font-bold">Café por mês</div>
                <div className="text-sm text-emerald-100/70">só isso, sem lucro exagerado</div>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-900/40">
                <Users className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-2xl font-bold">+2.500</div>
                <div className="text-sm text-emerald-100/70">professores já usando</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              DEPOIMENTOS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Professores que <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">mudaram de vida</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              Mais de 2.500 professores já transformaram sua rotina.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-900/40 relative"
              >
                <Quote className="w-8 h-8 text-emerald-500/30 absolute top-4 right-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-emerald-100/90 mb-6 leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-emerald-100/60">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
              <Coffee className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-semibold">PAGUE UM CAFÉ POR MÊS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Só R$ 3,49 por mês. <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">Sério.</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              Professor apoiando professor. Sem intermediários, sem CPM, sem acionistas. Um cafézinho pra sustentar o sistema.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="p-8 sm:p-10 rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-900/30 to-transparent shadow-2xl shadow-emerald-500/20 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                PLANO ÚNICO
              </div>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-emerald-100/60 mb-6">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-sm text-emerald-100/60">R$</span>
                <span className="text-6xl font-bold bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">{plan.price}</span>
                <span className="text-emerald-100/60 text-xl">{plan.period}</span>
              </div>
              <p className="text-xs text-emerald-100/50 mb-6">no cartão de crédito • recorrência mensal via Mercado Pago</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-emerald-100/90">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={MERCADO_PAGO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
              >
                {plan.cta} <ArrowRight className="inline w-4 h-4 ml-2" />
              </a>
              <p className="text-xs text-emerald-100/50 mt-4 text-center">
                🔒 Pagamento seguro Mercado Pago • Abre em nova aba
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-emerald-100/50">
            <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Dados criptografados</div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Conforme LGPD</div>
            <div className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Backup automático</div>
            <div className="flex items-center gap-1"><Coffee className="w-3 h-3" /> Só um cafézinho</div>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold mb-4">
              AINDA EM DÚVIDA?
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Receba <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">10 dicas</span> de organização
            </h2>
            <p className="text-emerald-100/70 text-lg mb-8">
              Ebook gratuito + atualizações. Sem spam.
            </p>

            {sent ? (
              <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Tudo certo!</h3>
                <p className="text-emerald-100/70">Você receberá o material no email informado.</p>
              </div>
            ) : (
              <form onSubmit={handleLead} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-emerald-900/20 border border-emerald-700 text-white placeholder:text-emerald-100/40 focus:outline-none focus:border-emerald-500"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30"
                >
                  Quero receber <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              PERGUNTAS FREQUENTES
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold">
              Ainda tem <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">dúvidas?</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl bg-emerald-900/10 border border-emerald-900/40 overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-emerald-900/20 transition"
                >
                  <span className="font-semibold text-emerald-100">{faq.q}</span>
                  <ChevronDown className={cn('w-5 h-5 text-emerald-400 flex-shrink-0 transition-transform', faqOpen === i && 'rotate-180')} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-emerald-100/70 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-yellow-500/10" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Coffee className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              Comece hoje por <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">um cafézinho</span>
            </h2>
            <p className="text-xl text-emerald-100/80 mb-8">
              Junte-se a +2.500 professores que já organizaram a vida. R$ 3,49/mês, sem fidelidade.
            </p>
            <a href={MERCADO_PAGO_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 text-base sm:text-lg px-10">
                Assinar agora <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <p className="text-sm text-emerald-100/60 mt-4">
              7 dias grátis • Sem cartão pra testar • Cancele quando quiser
            </p>

            <div className="mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Ou fale com a gente no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-emerald-900/30 bg-[#0a1410]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">Controle de Aulas</span>
              </div>
              <p className="text-sm text-emerald-100/60">
                Sistema de gestão feito por professor, para professor. 27 anos de carreira em cada detalhe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Produto</h4>
              <ul className="space-y-2 text-sm text-emerald-100/60">
                <li><Link href="/sistema" className="hover:text-emerald-300">Ver sistema</Link></li>
                <li><a href="#features" className="hover:text-emerald-300">Recursos</a></li>
                <li><a href="#precos" className="hover:text-emerald-300">Preço</a></li>
                <li><a href="#faq" className="hover:text-emerald-300">FAQ</a></li>
                <li><Link href="/login" className="hover:text-emerald-300">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Empresa</h4>
              <ul className="space-y-2 text-sm text-emerald-100/60">
                <li><a href="#" className="hover:text-emerald-300">Sobre nós</a></li>
                <li><a href="#" className="hover:text-emerald-300">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-300">Contato</a></li>
                <li><a href="#" className="hover:text-emerald-300">Parcerias</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-emerald-100/60">
                <li><a href="#" className="hover:text-emerald-300">Termos de uso</a></li>
                <li><a href="#" className="hover:text-emerald-300">Privacidade</a></li>
                <li><a href="#" className="hover:text-emerald-300">LGPD</a></li>
                <li><a href="#" className="hover:text-emerald-300">Direitos autorais</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-emerald-900/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-emerald-100/50">
            <p>© 2026 Controle de Aulas. Professor apoiando professor. ☕</p>
            <p>Feito com 💚 no Brasil</p>
          </div>
          <div className="mt-6 p-3 rounded-lg bg-emerald-900/10 border border-emerald-900/30 text-[11px] text-emerald-100/40 leading-relaxed">
            <strong className="text-emerald-100/60">Aviso de direitos autorais:</strong> Este software é protegido por direitos autorais. A reprodução, distribuição, modificação ou comercialização não autorizada deste sistema, no todo ou em parte, sem o consentimento expresso por escrito do desenvolvedor, constitui violação da Lei nº 9.610/98 (Lei de Direitos Autorais). Para licenciamento comercial, parcerias ou autorizações, entre em contato pelo WhatsApp +55 11 96616-1611.
          </div>
        </div>
      </footer>
    </div>
  );
}
