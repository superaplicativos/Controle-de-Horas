'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { seedGuilherme } from '@/lib/seed';

export default function Home() {
  const router = useRouter();
  const { sessao, carregando } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await seedGuilherme(); // cadastra Guilherme na 1a vez
      } catch {
        // ignore
      }
      if (!carregando) {
        if (sessao) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }
    })();
  }, [carregando, sessao, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Carregando...</div>
    </div>
  );
}
