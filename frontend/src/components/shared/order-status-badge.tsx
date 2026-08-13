import { cn } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/lib/order-status';
import type { OrderStatus } from '@/types';

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }): JSX.Element {
  const meta = ORDER_STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', meta.className, className)}>
      {meta.label}
    </span>
  );
}
