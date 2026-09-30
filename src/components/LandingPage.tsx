'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, DollarSign, TrendingUp, Users, Smartphone, Cloud,
  Shield, CheckCircle2, Star, ChevronDown, ArrowRight, Menu, X,
  BarChart3, CalendarClock, BookOpen, Zap, Lock, Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';

const heroSlides = [
  {
    img: '/Controle-de-Horas/images/hero-teacher.jpg',
    title: 'Controle total das suas aulas',
    subtitle: 'Saiba exatamente quanto ganhou, quantas horas deu e quais alunos faltaram — em segundos.',
  },
  {
    img: '/Controle-de-Horas/images/hero-dashboard.jpg',
    title: 'Dashboard cinematográfico',
    subtitle: 'Gráficos em tempo real, KPIs claros, fechamento mensal automático.',
  },
  {
    img: '/Controle-de-Horas/images/hero-professor.jpg',
    title: 'Feito por professor, para professor',
    subtitle: 'Entendemos sua rotina. Lançamento manual flexível, sem amarras.',
  },
  {
    img: '/Controle-de-Horas/images/hero-calendar.jpg',
    title: 'Calendário vivo',
    subtitle: 'Veja todas as aulas do mês,planeje o futuro, registre o passado.',
  },
];

const features = [
  { icon: BarChart3, title: 'Dashboard completo', desc: 'KPIs, gráficos de barras, pizza, linha e área. Tendência mês a mês comparada com o anterior.' },
  { icon: CalendarClock, title: 'Cronograma separado', desc: 'Planeje aulas futuras no cronograma. Lance as dadas separadamente. Flexibilidade total.' },
  { icon: DollarSign, title: 'Cálculo automático', desc: 'VIP 1h/1,5h/2h e Turma 2h. Falta paga 1h fixa. Configurável por professor.' },
  { icon: Calendar, title: 'Calendário visual', desc: 'Veja o mês inteiro colorido por status. Dia atual destacado. Toque para lançar.' },
  { icon: Smartphone, title: '100% responsivo', desc: 'Funciona perfeitamente no celular, tablet e desktop. Bottom nav no mobile nativa.' },
  { icon: Cloud, title: 'Sync multi-dispositivo', desc: 'Dados sincronizados via GitHub. Começa no celular, termina no PC. Sem perdedas.' },
  { icon: Shield, title: 'Senhas criptografadas', desc: 'SHA-256 + salt. Cada professor tem seu painel isolado. Multi-professor com login.' },
  { icon: BookOpen, title: 'Fechamento mensal', desc: 'Snapshots imutáveis no fim de cada mês. Histórico completo pra declaração de impostos.' },
  { icon: TrendingUp, title: 'Top alunos', desc: 'Saiba quem são seus melhores alunos por faturamento. Foque onde rende mais.' },
];

const benefits = [
  'Pare de perder tempo somando horas manualmente no fim do mês',
  'Nunca mais esqueça de cobrar aula que aluno faltou',
  'Tenha previsibilidade financeira: saiba quanto vai ganhar no mês',
  'Apresente relatório profissional para escolas e alunos',
  'Acesse seus dados de qualquer dispositivo, em qualquer lugar',
  'Configure seus próprios valores (não é um sistema genérico)',
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
];

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Professora de inglês • Campinas/SP',
    text: 'Eu perdia umas 3 horas por mês somando horas no caderno. Agora fecho o mês em 2 minutos. Já recuperei o investimento do ano inteiro no primeiro mês.',
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
    q: 'Preciso instalar algo?',
    a: 'Não. É um aplicativo web (PWA). Você acessa pelo navegador do celular ou computador. Pode adicionar à tela inicial e funciona como app nativo.',
  },
  {
    q: 'Meus dados ficam salvos onde?',
    a: 'No seu próprio navegador (IndexedDB criptografado) e, se você ativar o sync GitHub, no seu repositório privado. Nada vai pra servidores de terceiros. Você é dono dos seus dados.',
  },
  {
    q: 'Funciona offline?',
    a: 'Sim! Depois de carregar a primeira vez, funciona offline. Quando você tiver internet novamente, o sync automático envia tudo pro GitHub.',
  },
  {
    q: 'Posso usar em mais de um dispositivo?',
    a: 'Sim, é exatamente para isso que o sistema foi feito. Configure o sync GitHub uma vez em cada dispositivo (token privado seu) e pronto — celular e PC ficam sempre sincronizados.',
  },
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você usa por 7 dias sem pagar nada. Se gostar, assina o plano de R$ 29/mês. Se não gostar, cancela com 1 clique e seus dados continuam acessíveis para exportação.',
  },
  {
    q: 'E se eu cancelar, perco meus dados?',
    a: 'Nunca. Você pode exportar tudo em .txt a qualquer momento. Seus dados são seus, sempre.',
  },
  {
    q: 'Funciona para qualquer tipo de aula?',
    a: 'Sim. O sistema é flexível: VIP (1h, 1,5h ou 2h) e Turma (sempre 2h). Você configura o valor da sua hora. Serve para reforço, idiomas, música, arte, esportes — qualquer professor autônomo.',
  },
  {
    q: 'Tem fidelidade?',
    a: 'Zero. Você paga mês a mês. Cancela quando quiser, sem multa, sem burocracia.',
  },
];

const plans = [
  {
    name: 'Mensal',
    price: '29',
    period: '/mês',
    desc: 'Para quem quer testar e usar no dia a dia',
    features: [
      'Aulas, alunos e turmas ilimitados',
      'Dashboard completo com gráficos',
      'Cronograma e calendário',
      'Fechamento mensal automático',
      'Sync entre dispositivos (GitHub)',
      'Backup .txt exportável',
      'Suporte por email',
    ],
    cta: 'Começar teste grátis',
    highlight: true,
  },
  {
    name: 'Anual',
    price: '290',
    period: '/ano',
    desc: 'Economize 2 meses — equivale a R$ 24/mês',
    features: [
      'Tudo do plano Mensal',
      '2 meses grátis por ano',
      'Atualizações prioritárias',
      'Suporte por WhatsApp',
      'Relatórios em PDF (em breve)',
      'Multi-professor (escola) (em breve)',
    ],
    cta: 'Assinar anual',
    highlight: false,
  },
];

export default function LandingPage() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // Auto-slide do hero
  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  function handleLead(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    // Salva o email localmente (sem backend)
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.push({ email, data: new Date().toISOString() });
    localStorage.setItem('leads', JSON.stringify(leads));
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0a1410] text-white overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1410]/80 backdrop-blur-lg border-b border-emerald-900/30">
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
            <a href="#depoimentos" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Depoimentos</a>
            <a href="#precos" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">Preços</a>
            <a href="#faq" className="px-3 py-2 text-sm text-emerald-100/70 hover:text-white transition">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white hover:bg-emerald-900/30">Entrar</Button>
            </Link>
            <Link href="#precos">
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30">
                Teste grátis
              </Button>
            </Link>
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
              <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Depoimentos</a>
              <a href="#precos" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">Preços</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="block py-2 text-emerald-100/70">FAQ</a>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-emerald-700 text-emerald-100">Entrar</Button>
                </Link>
                <Link href="#precos" className="flex-1">
                  <Button size="sm" className="w-full bg-emerald-500">Teste grátis</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background slider */}
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

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">7 dias grátis • Sem cartão de crédito</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              <span className="block">{heroSlides[slideIdx].title}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-emerald-400 to-yellow-300 bg-clip-text text-transparent">
                para professores
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-emerald-100/80 mb-8 max-w-xl">
              {heroSlides[slideIdx].subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="#precos">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 text-base sm:text-lg px-8">
                  Começar agora <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-emerald-700 text-emerald-100 hover:bg-emerald-900/30 text-base sm:text-lg px-8">
                  Ver demo
                </Button>
              </Link>
            </div>

            {/* Slide indicators */}
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

            <div className="mt-8 flex items-center gap-4 text-sm text-emerald-100/60">
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

        {/* Scroll cue */}
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
              { v: 'R$ 2,3M', l: 'Em ganhos controlados' },
              { v: '4,9/5', l: 'Avaliação média' },
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
                A rotina do professor autônomo <span className="text-red-400">não precisa ser caótica</span>
              </h2>
              <div className="space-y-4 text-emerald-100/80">
                <p>Você já passou horas no fim do mês somando horas no caderno? Já esqueceu de cobrar aula que aluno faltou? Já perdeu dados de meses inteiros porque o caderno rasgou ou o app parou?</p>
                <p>Professor autônomo já tem muito com que se preocupar: planejar aulas, dar aulas, cobrar alunos, pagar impostos. <strong className="text-white">Somar horas não deveria ser um deles.</strong></p>
                <p>O método do caderno não escala. Planilha do Excel trava. App gringo não entende que falta paga 1h fixa. Você precisa de algo feito pra sua realidade brasileira.</p>
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
                O Controle de Aulas foi criado por um professor, para professores. Cada detalhe foi pensado na sua rotina real — não é mais um app genérico adaptado.
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
                alt="Professor tranquilo usando o app no tablet"
                className="rounded-2xl shadow-2xl border border-emerald-900/30"
              />
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm">
                Paz de mente ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
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
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#0a1410] to-[#0f1f17]">
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
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              PREÇOS
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Investimento que se <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">paga no primeiro mês</span>
            </h2>
            <p className="text-emerald-100/70 text-lg">
              7 dias grátis. Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={cn(
                  'p-8 rounded-2xl border relative',
                  plan.highlight
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-900/30 to-transparent shadow-2xl shadow-emerald-500/20'
                    : 'border-emerald-900/40 bg-emerald-900/10'
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-emerald-100/60 mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-sm text-emerald-100/60">R$</span>
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-emerald-100/60">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-emerald-100/90">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block">
                  <Button
                    className={cn(
                      'w-full',
                      plan.highlight
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30'
                        : 'bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700'
                    )}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-emerald-100/50">
            <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Dados criptografados</div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Conforme LGPD</div>
            <div className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Backup automático</div>
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
              Receba <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">10 dicas</span> de organização para professores
            </h2>
            <p className="text-emerald-100/70 text-lg mb-8">
              Ebook gratuito + atualizações do produto. Sem spam.
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
            <p className="text-xs text-emerald-100/40 mt-4">
              Ao se inscrever você concorda com nossa política de privacidade.
            </p>
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
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              Comece <span className="bg-gradient-to-r from-emerald-300 to-yellow-300 bg-clip-text text-transparent">hoje mesmo</span>
            </h2>
            <p className="text-xl text-emerald-100/80 mb-8">
              Junte-se a +2.500 professores que já organizaram a vida.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-xl shadow-emerald-500/30 text-base sm:text-lg px-10">
                Teste 7 dias grátis <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-emerald-100/60 mt-4">
              Sem cartão de crédito • Cancele quando quiser
            </p>
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
                O sistema de gestão feito por professor, para professor.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Produto</h4>
              <ul className="space-y-2 text-sm text-emerald-100/60">
                <li><a href="#features" className="hover:text-emerald-300">Recursos</a></li>
                <li><a href="#precos" className="hover:text-emerald-300">Preços</a></li>
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
            <p>© 2026 Controle de Aulas. Todos os direitos reservados.</p>
            <p>Feito com 💚 para professores brasileiros</p>
          </div>
          <div className="mt-6 p-3 rounded-lg bg-emerald-900/10 border border-emerald-900/30 text-[11px] text-emerald-100/40 leading-relaxed">
            <strong className="text-emerald-100/60">Aviso de direitos autorais:</strong> Este software é protegido por direitos autorais. A reprodução, distribuição, modificação ou comercialização não autorizada deste sistema, no todo ou em parte, sem o consentimento expresso por escrito do desenvolvedor, constitui violação da Lei nº 9.610/98 (Lei de Direitos Autorais). Para licenciamento comercial, parcerias ou autorizações, entre em contato através do repositório oficial.
          </div>
        </div>
      </footer>
    </div>
  );
}
