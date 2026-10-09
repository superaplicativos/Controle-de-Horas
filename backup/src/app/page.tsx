import LandingPage from '@/components/LandingPage';
import AuthRedirect from '@/components/AuthRedirect';

/**
 * Página inicial (Server Component).
 *
 * Renderiza a LandingPage estaticamente no HTML (visível para crawlers
 * mesmo sem JavaScript). O AuthRedirect é um client component pequeno
 * que só faz redirect se o usuário já estiver logado — sem bloquear
 * a renderização do conteúdo principal.
 */
export default function Home() {
  return (
    <>
      <AuthRedirect />
      <LandingPage />
    </>
  );
}
