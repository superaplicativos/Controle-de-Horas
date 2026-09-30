import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

const SITE_URL = 'https://superaplicativos.github.io/Controle-de-Horas';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Controle de Aulas | Gestão de Aulas, Cronograma e Valor a Receber para Professores',
  description:
    'Registre aulas dadas, organize o cronograma e saiba quanto vai receber por aula e por mês. Sistema para professores autônomos. Teste grátis por 7 dias.',
  authors: [{ name: 'Controle de Aulas' }],
  creator: 'Controle de Aulas',
  publisher: 'Controle de Aulas',
  applicationName: 'Controle de Aulas',
  category: 'Education',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'Controle de Aulas',
    title: 'Controle de Aulas | Gestão de Aulas, Cronograma e Valor a Receber para Professores',
    description:
      'Registre aulas dadas, organize o cronograma e saiba quanto vai receber por aula e por mês. Sistema para professores autônomos. Teste grátis por 7 dias.',
    images: [
      {
        url: '/Controle-de-Horas/images/og-cover.jpg',
        width: 1344,
        height: 768,
        alt: 'Painel do Controle de Aulas mostrando gráficos de aulas dadas, calendário e valor a receber no mês',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Controle de Aulas | Gestão de Aulas para Professores',
    description:
      'Registre aulas dadas, organize o cronograma e saiba quanto vai receber. Teste grátis por 7 dias.',
    images: ['/Controle-de-Horas/images/og-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Controle de Aulas',
  },
  manifest: '/Controle-de-Horas/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0a1410',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

// JSON-LD: dados estruturados para AEO/SEO
const jsonLdSoftwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Controle de Aulas',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: 'pt-BR',
  description:
    'Sistema online para professores autônomos registrar aulas dadas, organizar o cronograma, calcular o valor a receber por aula e por mês, fazer fechamento mensal e sincronizar entre dispositivos.',
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    price: '3.49',
    priceCurrency: 'BRL',
    description: 'Assinatura mensal com 7 dias grátis',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Controle de Aulas',
    url: SITE_URL,
  },
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Controle de Aulas',
  url: SITE_URL,
  inLanguage: 'pt-BR',
  publisher: {
    '@type': 'Organization',
    name: 'Controle de Aulas',
    url: SITE_URL,
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Controle de Aulas',
  url: SITE_URL,
  logo: `${SITE_URL}/images/og-cover.jpg`,
  description:
    'Sistema de gestão de aulas para professores autônomos. Feito por professores, para professores.',
  foundingDate: '2026',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    telephone: '+55-11-96616-1611',
    availableLanguage: ['pt-BR'],
  },
};

const jsonLdFAQPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quanto custa o Controle de Aulas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O Controle de Aulas custa R$ 3,49 por mês, pagos via Mercado Pago no cartão de crédito. A assinatura é mensal e recorrente, sem fidelidade. Você pode cancelar quando quiser.',
      },
    },
    {
      '@type': 'Question',
      name: 'Tem teste grátis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Você tem 7 dias grátis para testar o sistema sem precisar de cartão de crédito. Se gostar, assina por R$ 3,49 por mês.',
      },
    },
    {
      '@type': 'Question',
      name: 'Funciona no celular?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. O Controle de Aulas é 100% responsivo e funciona no celular, tablet e computador. No celular tem navegação inferior nativa e modais que abrem como bottom-sheet. Pode ser adicionado à tela inicial como aplicativo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como sincronizo entre celular e computador?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A sincronização entre dispositivos é automática. Você não precisa configurar nada — basta fazer login com o mesmo usuário e senha em cada dispositivo. Os dados são sincronizados em poucos segundos via Cloudflare Worker.',
      },
    },
    {
      '@type': 'Question',
      name: 'O sistema controla aulas particulares e aulas em turma?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. O Controle de Aulas trata os dois tipos: aulas VIP (particulares) com duração de 1, 1,5 ou 2 horas, e aulas em turma com duração fixa de 2 horas. O valor de cada modalidade é calculado automaticamente.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona o fechamento mensal das aulas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No fim de cada mês, você clica em "Fechar Mês" no dashboard. O sistema cria um snapshot imutável com o total de aulas, horas trabalhadas, valor a receber e faltas do mês. O histórico fica disponível para consulta futura.',
      },
    },
    {
      '@type': 'Question',
      name: 'Posso exportar meus dados?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. Você pode exportar todos os seus dados em arquivo .txt a qualquer momento na página de Configurações. O arquivo é legível e pode ser aberto no Bloco de Notas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Meus dados estão seguros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim. As senhas são criptografadas com SHA-256 e salt. Cada professor tem seu painel isolado. O token de acesso ao GitHub fica protegido no servidor Cloudflare Worker, nunca exposto no navegador. Os dados são armazenados no seu navegador e sincronizados de forma segura.',
      },
    },
  ],
};

const jsonLdHowTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Como usar o Controle de Aulas para gerenciar aulas particulares',
  description:
    'Passo a passo para registrar aulas, calcular o valor a receber e fazer o fechamento mensal.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Crie sua conta',
      text: 'Cadastre-se com usuário, senha, nome completo e valor por hora. O sistema já vem pronto para usar, sem configuração adicional.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Cadastre seus alunos e turmas',
      text: 'Adicione alunos VIP (1, 1,5 ou 2 horas) e crie turmas (duração fixa de 2 horas). Marque alunos como ativos ou inativos conforme necessário.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Registre as aulas dadas',
      text: 'Na página "Aulas Dadas", toque em "Nova Aula". A data de hoje já vem preenchida. Escolha o aluno, horário, duração e status (presença, falta ou cancelada). O valor é calculado automaticamente.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Acompanhe o dashboard',
      text: 'Veja em tempo real o número de aulas, horas trabalhadas, valor a receber e faltas do mês. Gráficos mostram a distribuição das aulas por dia, semana e por aluno.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Faça o fechamento mensal',
      text: 'No fim do mês, clique em "Fechar Mês". O sistema gera um snapshot com o total de aulas, horas e valor a receber. O histórico fica salvo para consulta.',
    },
  ],
};

const jsonLdBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Início',
      item: SITE_URL,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApplication) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQPage) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
