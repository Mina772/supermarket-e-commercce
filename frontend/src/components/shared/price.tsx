import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Props {
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Price({
  price,
  compareAtPrice,
  discountPercentage = 0,
  currency = 'USD',
  className,
  size = 'md',
}: Props): JSX.Element {
  const showOriginal = discountPercentage > 0 && compareAtPrice && compareAtPrice > price;
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-bold text-foreground', sizes[size])}>{formatCurrency(price, currency)}</span>
      {showOriginal && (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(compareAtPrice as number, currency)}
        </span>
      )}
    </div>
  );
}
