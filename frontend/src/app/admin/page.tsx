'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Package, Users, Clock, Star, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/admin/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/lib/order-status';
import type { OrderStatus } from '@/types';

export default function AdminDashboardPage(): JSX.Element {
  const metrics = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: api.analytics.dashboard });
  const sales = useQuery({ queryKey: ['admin', 'sales', 30], queryFn: () => api.analytics.sales(30) });
  const byStatus = useQuery({ queryKey: ['admin', 'orders-by-status'], queryFn: api.analytics.ordersByStatus });

  const m = metrics.data;
  const maxRevenue = Math.max(1, ...(sales.data ?? []).map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Store performance at a glance.</p>
      </div>

      {metrics.isLoading || !m ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Revenue" value={formatCurrency(m.revenue)} icon={DollarSign} accent="emerald" hint={`${m.paidOrders} paid orders`} />
          <StatCard title="Total orders" value={m.totalOrders} icon={ShoppingCart} accent="sky" hint={`${m.pendingOrders} pending`} />
          <StatCard title="Avg. order value" value={formatCurrency(m.averageOrderValue)} icon={TrendingUp} accent="primary" />
          <StatCard title="Customers" value={m.totalCustomers} icon={Users} accent="primary" />
          <StatCard title="Products" value={m.totalProducts} icon={Package} accent="sky" />
          <StatCard title="Low stock" value={m.lowStock} icon={AlertTriangle} accent="amber" hint="Needs restock" />
          <StatCard title="Pending orders" value={m.pendingOrders} icon={Clock} accent="amber" />
          <StatCard title="Pending reviews" value={m.pendingReviews} icon={Star} accent="rose" hint="Awaiting moderation" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Revenue — last 30 days</h2>
          {sales.isLoading ? (
            <Skeleton className="mt-4 h-48 w-full" />
          ) : (sales.data?.length ?? 0) === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1">
              {sales.data?.map((d) => (
                <div key={d.date} className="group relative flex-1" title={`${d.date}: ${formatCurrency(d.revenue)}`}>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Orders by status</h2>
          {byStatus.isLoading ? (
            <Skeleton className="mt-4 h-48 w-full" />
          ) : (
            <ul className="mt-4 space-y-3">
              {byStatus.data?.map((s) => {
                const meta = ORDER_STATUS_META[s.status as OrderStatus];
                return (
                  <li key={s.status} className="flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta?.className ?? 'bg-muted'}`}>
                      {meta?.label ?? s.status}
                    </span>
                    <span className="font-semibold">{s.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
