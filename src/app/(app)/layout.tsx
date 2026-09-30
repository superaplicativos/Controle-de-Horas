'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, LayoutDashboard, CalendarDays, ClipboardList, CalendarClock, Users, Users2, BarChart3, User, Settings, LogOut, Menu, X, Cloud, Home } from 'lucide-react';
import { sincronizarDoGitHub, lerConfigLocal } from '@/lib/github';
import { seedGuilherme } from '@/lib/seed';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Início', icon: Home, shortLabel: 'Início' },
  { href: '/cronograma', label: 'Cronograma', icon: CalendarClock, shortLabel: 'Cronog.' },
  { href: '/aulas', label: 'Aulas Dadas', icon: ClipboardList, shortLabel: 'Aulas' },
  { href: '/calendario', label: 'Calendário', icon: CalendarDays, shortLabel: 'Calend.' },
  { href: '/alunos', label: 'Alunos', icon: Users, shortLabel: 'Alunos' },
  { href: '/turmas', label: 'Turmas', icon: Users2, shortLabel: 'Turmas' },
  { href: '/fechamentos', label: 'Fechamentos', icon: BarChart3, shortLabel: 'Fecham.' },
  { href: '/perfil', label: 'Perfil', icon: User, shortLabel: 'Perfil' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, shortLabel: 'Config.' },
];

// 5 principais para a bottom nav mobile
const mobileNavItems = [
  { href: '/dashboard', label: 'Início', icon: Home },
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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [autoSyncOn, setAutoSyncOn] = useState(false);

  useEffect(() => {
    if (!carregando && !sessao) {
      router.replace('/login');
    }
  }, [carregando, sessao, router]);

  // Auto-sync ao abrir o app: puxa o TXT mais recente do GitHub
  useEffect(() => {
    if (!sessao || !professor) return;
    (async () => {
      try {
        await seedGuilherme();
      } catch (e) {
        console.error('seed error', e);
      }
      const config = await lerConfigLocal();
      if (config?.github_token && config.github_repo) {
        setAutoSyncOn(true);
        setSyncing(true);
        const res = await sincronizarDoGitHub(professor.id);
        setSyncing(false);
        if (res.ok) {
          setSyncMsg(`Sync: ${res.aulasImportadas || 0} aulas`);
          setTimeout(() => setSyncMsg(''), 4000);
        } else {
          setSyncMsg(`Sync falhou`);
          setTimeout(() => setSyncMsg(''), 6000);
        }
      }
    })();
  }, [sessao, professor]);

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
        </nav>
        <div className="border-t p-2 space-y-1">
          {autoSyncOn && (
            <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Cloud className={cn('w-3 h-3 flex-shrink-0', syncing && 'animate-pulse text-emerald-600')} />
              <span className="truncate">{syncing ? 'Sincronizando...' : 'Sync ON'}</span>
            </div>
          )}
          {syncMsg && (
            <div className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 rounded truncate">
              {syncMsg}
            </div>
          )}
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
        {autoSyncOn && (
          <Cloud className={cn('w-4 h-4 text-muted-foreground flex-shrink-0', syncing && 'animate-pulse text-emerald-600')} />
        )}
        <div className="w-5 flex-shrink-0" />
      </header>

      {/* Sync msg banner mobile */}
      {syncMsg && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-emerald-100 text-emerald-800 text-xs text-center py-1 px-3 truncate">
          {syncMsg}
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
            </nav>
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600" onClick={() => { setMenuOpen(false); logout(); }}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 pb-20 md:pb-0 md:pt-0">
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
