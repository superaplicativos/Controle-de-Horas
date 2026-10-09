import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ClipboardList, Users, Users2, CalendarClock, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Início', icon: LayoutDashboard },
  { href: '/aulas', label: 'Aulas', icon: ClipboardList },
  { href: '/cronograma', label: 'Cronograma', icon: CalendarClock },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/turmas', label: 'Turmas', icon: Users2 },
  { href: '/configuracoes', label: 'Config', icon: Settings },
];

const mobileNav = [
  { href: '/', label: 'Início', icon: LayoutDashboard },
  { href: '/aulas', label: 'Aulas', icon: ClipboardList },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/configuracoes', label: 'Mais', icon: Settings },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-white fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center gap-2 px-4 border-b">
          <div className="w-9 h-9 rounded-lg bg-marca-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm">Controle de Horas</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-marca-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b flex items-center px-3">
        <div className="w-8 h-8 rounded-lg bg-marca-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm ml-2">Controle de Horas</span>
      </header>

      {/* Conteúdo */}
      <main className="md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t grid grid-cols-4 h-16">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                  isActive ? 'text-marca-600 font-semibold' : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
