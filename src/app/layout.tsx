import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Controle de Aulas',
  description: 'Sistema de controle de aulas para professores - VIP e Turma',
  applicationName: 'Controle de Aulas',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Controle de Aulas',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
