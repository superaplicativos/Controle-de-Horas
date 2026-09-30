'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { seedGuilherme } from '@/lib/seed';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const router = useRouter();
  const { sessao, carregando } = useAuth();
  const [seedPronto, setSeedPronto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await seedGuilherme();
      } catch (e) {
        console.error('seed error', e);
      } finally {
        setSeedPronto(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!carregando && seedPronto && sessao) {
      router.replace('/dashboard');
    }
  }, [carregando, sessao, router, seedPronto]);

  // Se não está logado, mostra a landing page
  if (!carregando && !sessao && seedPronto) {
    return <LandingPage />;
  }

  // Loading state enquanto verifica sessão
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1410]">
      <div className="animate-pulse text-emerald-300">Carregando...</div>
    </div>
  );
}
