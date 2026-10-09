'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Componente client-side que faz redirect silencioso para /dashboard
 * se o usuário já estiver logado. Não renderiza nada visível — só
 * executa o redirect após a hidratação. O conteúdo da landing page
 * é renderizado server-side e permanece visível para crawlers.
 */
export default function AuthRedirect() {
  const router = useRouter();
  const { sessao, carregando } = useAuth();

  useEffect(() => {
    if (!carregando && sessao) {
      router.replace('/dashboard');
    }
  }, [carregando, sessao, router]);

  return null;
}
