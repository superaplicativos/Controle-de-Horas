'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, LayoutDashboard, CalendarDays, ClipboardList, CalendarClock, Users, Users2, BarChart3, User, Settings, LogOut, Menu, X, Cloud } from 'lucide-react';
import { sincronizarDoGitHub, lerConfigLocal } from '@/lib/github';
import { cn } from '@/lib/utils';

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
      const config = await lerConfigLocal();
      if (config?.github_token && config.github_repo) {
        setAutoSyncOn(true);
        setSyncing(true);
        const res = await sincronizarDoGitHub(professor.id);
        setSyncing(false);
        if (res.ok) {
          setSyncMsg(`Sincronizado: ${res.aulasImportadas || 0} aulas`);
          setTimeout(() => setSyncMsg(''), 4000);
        } else {
          setSyncMsg(`Sync falhou: ${res.erro}`);
          setTimeout(() => setSyncMsg(''), 6000);
        }
      }
    })();
  }, [sessao, professor]);

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
          <div className="flex-1">
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
        <div className="border-t p-2">
          {autoSyncOn && (
            <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
              <Cloud className={cn('w-3 h-3', syncing && 'animate-pulse text-emerald-600')} />
              {syncing ? 'Sincronizando...' : 'Sync automático ON'}
            </div>
          )}
          {syncMsg && (
            <div className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 rounded">
              {syncMsg}
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b flex items-center px-3">
        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-sm">Controle de Aulas</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 left-0 w-64 bg-card border-r h-[calc(100%-3.5rem)] p-2 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  <Button variant={active ? 'default' : 'ghost'} className={cn('w-full justify-start mb-1', active && 'bg-emerald-600')} size="sm">
                    <Icon className="w-4 h-4 mr-2" /> {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 mt-4" onClick={() => { setMenuOpen(false); logout(); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
