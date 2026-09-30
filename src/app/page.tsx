'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { seedGuilherme } from '@/lib/seed';

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
    if (!carregando && seedPronto) {
      if (sessao) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [carregando, sessao, router, seedPronto]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );
}
