import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

export function RatingStars({ value, count, size = 16, className }: Props): JSX.Element {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              i <= Math.round(value) ? 'fill-[hsl(var(--warning))] text-[hsl(var(--warning))]' : 'text-muted-foreground/40',
            )}
          />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
