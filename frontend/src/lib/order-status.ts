import type { OrderStatus } from '@/types';

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  paid: { label: 'Paid', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  processing: { label: 'Processing', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400' },
  shipping: { label: 'Shipping', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  refunded: { label: 'Refunded', className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400' },
};

export const ORDER_TIMELINE: OrderStatus[] = ['pending', 'paid', 'processing', 'shipping', 'delivered'];
