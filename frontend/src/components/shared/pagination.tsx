'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props): JSX.Element | null {
  if (totalPages <= 1) return null;

  const pages = pageRange(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Button variant="outline" size="icon" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onChange(p as number)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="icon" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

function pageRange(current: number, total: number): (number | '…')[] {
  const delta = 1;
  const range: (number | '…')[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i += 1) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);
  return range;
}
