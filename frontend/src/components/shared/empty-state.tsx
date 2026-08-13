import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }: Props): JSX.Element {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center', className)}>
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
