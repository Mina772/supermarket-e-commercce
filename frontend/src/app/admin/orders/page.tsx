'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/admin/data-table';
import { OrderStatusBadge } from '@/components/shared/order-status-badge';
import { Pagination } from '@/components/shared/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, OrderStatus, User } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'];
const NEXT_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrdersPage(): JSX.Element {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, status],
    queryFn: () => api.orders.all({ page, ...(status ? { status } : {}) }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => api.orders.updateStatus(id, next),
    onSuccess: () => {
      toast.success('Order status updated');
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const orders = data?.items ?? [];
  const totalPages = Number(data?.meta?.totalPages ?? 1);

  const columns: Column<Order>[] = [
    { header: 'Order', cell: (o) => <span className="font-medium">#{o.orderNumber}</span> },
    {
      header: 'Customer',
      cell: (o) => {
        const u = typeof o.user === 'object' ? (o.user as User) : null;
        return u ? `${u.firstName} ${u.lastName}` : '—';
      },
    },
    { header: 'Date', cell: (o) => formatDate(o.createdAt) },
    { header: 'Items', cell: (o) => o.items.length },
    { header: 'Total', cell: (o) => <span className="font-semibold">{formatCurrency(o.grandTotal)}</span> },
    { header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      header: 'Update',
      cell: (o) => (
        <select
          className="h-9 rounded-lg border bg-background px-2 text-xs"
          value=""
          onChange={(e) => e.target.value && updateStatus.mutate({ id: o._id, next: e.target.value })}
          disabled={o.status === 'delivered' || o.status === 'cancelled' || o.status === 'refunded'}
        >
          <option value="">Change…</option>
          {NEXT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <select
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} rows={orders} isLoading={isLoading} rowKey={(o) => o._id} emptyLabel="No orders found" />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
