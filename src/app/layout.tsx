import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://superaplicativos.github.io'),
  title: {
    default: 'Controle de Aulas — Sistema de Gestão para Professores',
    template: '%s | Controle de Aulas',
  },
  description: 'Sistema completo de controle de aulas para professores autônomos. Dashboard com gráficos, calendário, cronograma, fechamento mensal e sync multi-dispositivo. Feito por professor, para professor. Teste 7 dias grátis.',
  keywords: [
    'controle de aulas',
    'sistema para professores',
    'gestão de aulas particulares',
    'professor autônomo',
    'aulas VIP',
    'aulas de turma',
    'controle de horas professor',
    'calendário de aulas',
    'fechamento mensal professor',
    'app para professor particular',
    'software para professores',
    'controle financeiro professor',
    'soma de horas de aula',
    'registro de aulas dadas',
  ],
  authors: [{ name: 'Controle de Aulas' }],
  creator: 'Controle de Aulas',
  publisher: 'Controle de Aulas',
  applicationName: 'Controle de Aulas',
  category: 'Education',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://superaplicativos.github.io/Controle-de-Horas/',
    siteName: 'Controle de Aulas',
    title: 'Controle de Aulas — Sistema de Gestão para Professores',
    description: 'Sistema completo de controle de aulas para professores autônomos. Dashboard, calendário, fechamento mensal e sync multi-dispositivo. Teste 7 dias grátis.',
    images: [
      {
        url: '/Controle-de-Horas/images/og-cover.jpg',
        width: 1344,
        height: 768,
        alt: 'Controle de Aulas — Dashboard cinematográfico para professores',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Controle de Aulas — Sistema de Gestão para Professores',
    description: 'Dashboard, calendário, fechamento mensal e sync multi-dispositivo. Feito por professor, para professor.',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Controle de Aulas',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  description: 'Sistema completo de controle de aulas para professores autônomos. Dashboard com gráficos, calendário, cronograma, fechamento mensal e sync multi-dispositivo.',
  url: 'https://superaplicativos.github.io/Controle-de-Horas/',
  offers: {
    '@type': 'Offer',
    price: '29',
    priceCurrency: 'BRL',
    description: 'Plano mensal com 7 dias grátis',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '2487',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Controle de Aulas',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
