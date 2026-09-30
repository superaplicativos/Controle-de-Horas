'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  tendencia?: number; // % vs mês anterior
  icon?: LucideIcon;
  cor?: 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
}

const corMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', icon: 'bg-sky-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100' },
};

export function KpiCard({ titulo, valor, subtitulo, tendencia, icon: Icon, cor = 'emerald' }: KpiCardProps) {
  const c = corMap[cor];
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{titulo}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">{valor}</p>
            {subtitulo && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitulo}</p>}
            {tendencia !== undefined && (
              <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                <span className={cn('text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full',
                  tendencia >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}>
                  {tendencia >= 0 ? '↑' : '↓'} {Math.abs(tendencia).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-1.5 sm:p-2.5 rounded-lg flex-shrink-0', c.icon)}>
              <Icon className={cn('w-4 h-4 sm:w-6 sm:h-6', c.text)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
