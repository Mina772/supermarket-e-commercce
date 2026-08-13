'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantitySelector({ value, onChange, min = 1, max = 999, disabled, className }: Props): JSX.Element {
  return (
    <div className={cn('inline-flex items-center rounded-lg border bg-background', className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-accent/10 disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-accent/10 disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
