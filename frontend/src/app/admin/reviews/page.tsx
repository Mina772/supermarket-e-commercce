'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/admin/data-table';
import { RatingStars } from '@/components/shared/rating-stars';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import type { Product, Review, User } from '@/types';

const TABS = ['pending', 'approved', 'rejected'] as const;

export default function AdminReviewsPage(): JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', tab],
    queryFn: () => api.reviews.queue(tab),
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.reviews.moderate(id, status),
    onSuccess: () => {
      toast.success('Review updated');
      void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const reviews = data?.items ?? [];

  const columns: Column<Review>[] = [
    {
      header: 'Product',
      cell: (r) => (typeof r.product === 'object' ? (r.product as Product).name : String(r.product)),
    },
    {
      header: 'Customer',
      cell: (r) => {
        const u = typeof r.user === 'object' && r.user ? (r.user as Pick<User, 'firstName' | 'lastName'>) : null;
        return u ? `${u.firstName} ${u.lastName}` : 'Anonymous';
      },
    },
    { header: 'Rating', cell: (r) => <RatingStars value={r.rating} size={14} /> },
    {
      header: 'Review',
      cell: (r) => (
        <div className="max-w-xs">
          {r.title && <p className="font-medium">{r.title}</p>}
          <p className="line-clamp-2 text-xs text-muted-foreground">{r.comment}</p>
        </div>
      ),
    },
    { header: 'Date', cell: (r) => formatDate(r.createdAt) },
    {
      header: 'Status',
      cell: (r) => (
        <Badge variant={r.status === 'approved' ? 'outline' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.status !== 'approved' && (
            <Button size="icon" variant="ghost" aria-label="Approve" onClick={() => moderate.mutate({ id: r._id, status: 'approved' })}>
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
          {r.status !== 'rejected' && (
            <Button size="icon" variant="ghost" aria-label="Reject" onClick={() => moderate.mutate({ id: r._id, status: 'rejected' })}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium capitalize',
              tab === t ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={reviews} isLoading={isLoading} rowKey={(r) => r._id} emptyLabel="No reviews" />
    </div>
  );
}
