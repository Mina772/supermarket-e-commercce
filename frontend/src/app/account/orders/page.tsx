'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'mine', page],
    queryFn: () => api.orders.mine(page),
  });

  const orders = data?.items ?? [];
  const totalPages = Number(data?.meta?.totalPages ?? 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order it will appear here."
        action={
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order._id}
          href={`/account/orders/${order._id}`}
          className="block rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Order #{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={order.status} />
              <span className="font-bold">{formatCurrency(order.grandTotal)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
