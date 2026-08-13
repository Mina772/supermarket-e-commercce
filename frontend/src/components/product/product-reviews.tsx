'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { RatingStars } from '@/components/shared/rating-stars';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getInitials } from '@/lib/utils';

export function ProductReviews({ productId }: { productId: string }): JSX.Element {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.reviews.forProduct(productId),
  });

  const create = useMutation({
    mutationFn: () => api.reviews.create({ product: productId, rating, title, comment }),
    onSuccess: () => {
      toast.success('Review submitted for moderation');
      setTitle('');
      setComment('');
      void qc.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const reviews = data?.items ?? [];

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold tracking-tight">Customer reviews</h2>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          {isAuthenticated ? (
            <form
              className="space-y-4 rounded-2xl border bg-card p-6"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <h3 className="font-semibold">Write a review</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">Your rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <RatingStars value={n <= rating ? 1 : 0} size={24} />
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Review title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea
                placeholder="Share your thoughts about this product…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
              />
              <Button type="submit" loading={create.isPending}>
                Submit review
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              Please sign in to write a review.
            </div>
          )}
        </div>

        <div className="space-y-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((r) => {
              const author = typeof r.user === 'object' && r.user !== null ? r.user : undefined;
              return (
              <article key={r._id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(author?.firstName, author?.lastName)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {author?.firstName ?? 'Anonymous'} {author?.lastName ?? ''}
                    </p>
                    <RatingStars value={r.rating} size={14} />
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
