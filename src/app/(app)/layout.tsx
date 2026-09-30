'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, LayoutDashboard, CalendarDays, ClipboardList, CalendarClock, Users, Users2, BarChart3, User, Settings, LogOut, Menu, X, Cloud, CloudOff, RefreshCw, CloudCog, Shield } from 'lucide-react';
import { seedGuilherme } from '@/lib/seed';
import { subscribeSyncState, type SyncState, puxarDoGitHub, notificarDadosAtualizados, subscribeConfigState } from '@/lib/sync';
import { cn } from '@/lib/utils';
import { temAcessoLiberado, sincronizarAssinatura } from '@/lib/assinatura';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cronograma', label: 'Cronograma', icon: CalendarClock },
  { href: '/aulas', label: 'Aulas Dadas', icon: ClipboardList },
  { href: '/calendario', label: 'Calendário', icon: CalendarDays },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/turmas', label: 'Turmas', icon: Users2 },
  { href: '/fechamentos', label: 'Fechamentos', icon: BarChart3 },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

// Itens de admin (só aparecem para o dono)
const adminNavItems = [
  { href: '/admin', label: 'Painel Admin', icon: Shield },
];

const mobileNavItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/aulas', label: 'Aulas', icon: ClipboardList },
  { href: '/calendario', label: 'Calend.', icon: CalendarDays },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/configuracoes', label: 'Mais', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sessao, professor, carregando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    ultimoSync: null,
    erro: null,
    aulasSincronizadas: 0,
  });
  const [githubConfigured, setGithubConfigured] = useState(false);

  useEffect(() => {
    if (!carregando && !sessao) {
      router.replace('/login');
    }
  }, [carregando, sessao, router]);

  // Subscribe ao estado de sync
  useEffect(() => {
    const unsub = subscribeSyncState(setSyncState);
    return unsub;
  }, []);

  // Subscribe a mudanças de config do GitHub
  useEffect(() => {
    const unsub = subscribeConfigState((configured) => {
      setGithubConfigured(configured);
    });
    // Sync sempre ativo
    setGithubConfigured(true);
    return unsub;
  }, []);

  // Ao montar: seed + auto-pull + verificar assinatura
  useEffect(() => {
    if (!sessao || !professor) return;
    (async () => {
      try {
        await seedGuilherme();
        notificarDadosAtualizados();
      } catch (e) {
        console.error('seed error', e);
      }
      setGithubConfigured(true);
      await puxarDoGitHub(professor);

      // Verifica assinatura (sincroniza com Worker)
      try {
        const profAtualizado = await sincronizarAssinatura(professor);
        if (profAtualizado) {
          // Se mudou, força reload pra aplicar novo status
          window.location.reload();
          return;
        }
      } catch (e) {
        console.warn('Erro ao verificar assinatura:', e);
      }

      // Verifica acesso
      const acesso = temAcessoLiberado(professor);
      if (!acesso.liberado && !professor.is_admin && pathname !== '/configuracoes') {
        router.replace('/assinar');
      }
    })();
  }, [sessao, professor, router, pathname]);

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!sessao || !professor) {
    return null;
  }

  // Determinar ícone/label do sync
  const syncIcon = (() => {
    if (!githubConfigured) {
      return { Icon: CloudOff, color: 'text-gray-400', label: 'Sem sync' };
    }
    if (syncState.status === 'syncing') {
      return { Icon: RefreshCw, color: 'text-amber-500 animate-spin', label: 'Sincronizando...' };
    }
    if (syncState.status === 'error') {
      return { Icon: CloudOff, color: 'text-red-500', label: syncState.erro || 'Erro' };
    }
    if (syncState.status === 'synced') {
      return { Icon: Cloud, color: 'text-emerald-500', label: 'Sincronizado' };
    }
    return { Icon: CloudCog, color: 'text-muted-foreground', label: 'Aguardando' };
  })();

  const SyncIcon = syncIcon.Icon;

  return (
    <div className="min-h-screen flex bg-muted/10">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center gap-2 px-4 border-b">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">Controle de Aulas</div>
            <div className="text-xs text-muted-foreground truncate">{professor.nome}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={cn('w-full justify-start', active && 'bg-emerald-600 hover:bg-emerald-700')}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          {/* Itens de admin (só para o dono) */}
          {professor?.is_admin && (
            <>
              <div className="my-2 border-t border-emerald-900/30 pt-2">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-emerald-100/40 font-semibold">
                  Administração
                </div>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? 'default' : 'ghost'}
                      className={cn('w-full justify-start', active ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-400 hover:bg-yellow-900/20')}
                      size="sm"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="border-t p-2 space-y-1">
          <Link href="/configuracoes">
            <div className="px-2 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted rounded cursor-pointer">
              <SyncIcon className={cn('w-3.5 h-3.5 flex-shrink-0', syncIcon.color)} />
              <span className="truncate text-muted-foreground">{syncIcon.label}</span>
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b flex items-center px-3 safe-top">
        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)} className="flex-shrink-0 -ml-2">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm truncate">Controle de Aulas</span>
        </div>
        <Link href="/configuracoes" className="flex-shrink-0 p-1" aria-label="Status sync">
          <SyncIcon className={cn('w-5 h-5', syncIcon.color)} />
        </Link>
      </header>

      {/* Sync erro banner mobile */}
      {syncState.erro && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-red-100 text-red-800 text-xs text-center py-1 px-3 truncate">
          {syncState.erro}
        </div>
      )}

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-0 left-0 w-[280px] max-w-[80vw] bg-card h-full flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 flex items-center gap-2 px-4 border-b">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">Controle de Aulas</div>
                <div className="text-xs text-muted-foreground truncate">{professor.nome}</div>
              </div>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                    <Button variant={active ? 'default' : 'ghost'} className={cn('w-full justify-start', active && 'bg-emerald-600 hover:bg-emerald-700')} size="sm">
                      <Icon className="w-4 h-4 mr-2" /> {item.label}
                    </Button>
                  </Link>
                );
              })}
              {professor?.is_admin && (
                <>
                  <div className="my-2 border-t border-emerald-900/30 pt-2 px-2 text-[10px] uppercase tracking-wider text-emerald-100/40 font-semibold">
                    Administração
                  </div>
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                        <Button variant={active ? 'default' : 'ghost'} className={cn('w-full justify-start', active ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-400 hover:bg-yellow-900/20')} size="sm">
                          <Icon className="w-4 h-4 mr-2" /> {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
            <div className="border-t p-2 space-y-1">
              <div className="px-2 py-1 text-xs flex items-center gap-1.5">
                <SyncIcon className={cn('w-3.5 h-3.5 flex-shrink-0', syncIcon.color)} />
                <span className="truncate text-muted-foreground">{syncIcon.label}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600" onClick={() => { setMenuOpen(false); logout(); }}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 w-full md:ml-64 pt-14 pb-20 md:pb-0 md:pt-0">
        <div className="px-3 py-3 md:container md:mx-auto md:p-6 md:max-w-7xl">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
                  active ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                <span className="font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
