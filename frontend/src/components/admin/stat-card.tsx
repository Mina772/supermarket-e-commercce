import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: 'primary' | 'emerald' | 'amber' | 'sky' | 'rose';
}

const accents: Record<NonNullable<Props['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  sky: 'bg-sky-500/10 text-sky-600',
  rose: 'bg-rose-500/10 text-rose-600',
};

export function StatCard({ title, value, icon: Icon, hint, accent = 'primary' }: Props): JSX.Element {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl', accents[accent])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
