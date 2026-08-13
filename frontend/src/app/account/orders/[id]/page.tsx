'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { ORDER_TIMELINE, ORDER_STATUS_META } from '@/lib/order-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

export default function OrderDetailPage({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.orders.detail(id),
  });

  const cancel = useMutation({
    mutationFn: () => api.orders.cancel(id),
    onSuccess: () => {
      toast.success('Order cancelled');
      void qc.invalidateQueries({ queryKey: ['orders', id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading || !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const canCancel = order.status === 'pending' || order.status === 'paid';
  const currentIdx = ORDER_TIMELINE.indexOf(order.status);
  const isCancelledOrRefunded = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/account/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
          <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => cancel.mutate()} loading={cancel.isPending}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isCancelledOrRefunded ? (
        <div className="rounded-2xl border bg-card p-6">
          <ol className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            {ORDER_TIMELINE.map((step, i) => {
              const done = i <= currentIdx;
              return (
                <li key={step} className="flex items-center gap-3 sm:flex-col sm:text-center">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/40" />
                  )}
                  <span className={cn('text-sm font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                    {ORDER_STATUS_META[step].label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <Truck className="h-5 w-5 text-destructive" />
          This order was {order.status}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <h3 className="font-semibold">Items</h3>
          {order.items.map((item) => (
            <div key={item.sku} className="flex gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.thumbnail && <Image src={item.thumbnail} alt={item.name} fill className="object-cover" sizes="64px" />}
              </div>
              <div className="flex flex-1 justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.itemsTotal)} />
              {order.discountTotal > 0 && <Row label="Discount" value={`- ${formatCurrency(order.discountTotal)}`} />}
              <Row label="Shipping" value={order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee)} />
              <Row label="Tax" value={formatCurrency(order.taxTotal)} />
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatCurrency(order.grandTotal)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Payment: <span className="font-medium capitalize text-foreground">{order.paymentMethod}</span> ·{' '}
              <span className="capitalize">{order.paymentStatus}</span>
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold">Shipping address</h3>
            <address className="mt-3 not-italic text-sm text-muted-foreground">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}<br />
              {order.shippingAddress.phone}
            </address>
            {order.trackingNumber && (
              <p className="mt-3 text-sm">
                Tracking: <span className="font-medium">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
