'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Tag, ArrowRight } from 'lucide-react';
import { useCart, useCartMutations } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import { QuantitySelector } from '@/components/shared/quantity-selector';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, productImage } from '@/lib/utils';

export default function CartPage(): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading } = useCart();
  const { updateItem, removeItem, clear, applyCoupon, removeCoupon } = useCartMutations();
  const [code, setCode] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Sign in to view your cart"
          description="Your cart is saved to your account."
          action={
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const items = data?.cart.items ?? [];
  const totals = data?.totals;
  const hasCoupon = Boolean(data?.cart.coupon);

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Your cart is empty"
          description="Browse our fresh products and start filling your basket."
          action={
            <Button asChild>
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Shopping cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product._id} className="flex gap-4 rounded-2xl border bg-card p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={productImage(item.product)} alt={item.product.name} fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-primary">
                  {item.product.name}
                </Link>
                <span className="text-sm text-muted-foreground">{formatCurrency(item.priceSnapshot)} / {item.product.unit}</span>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantitySelector
                    value={item.quantity}
                    max={item.product.stock}
                    onChange={(q) => updateItem.mutate({ productId: item.product._id, quantity: q })}
                  />
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                    <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => removeItem.mutate(item.product._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => clear.mutate()}>
            Clear cart
          </Button>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Coupon code"
                className="pl-9"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={hasCoupon}
              />
            </div>
            {hasCoupon ? (
              <Button variant="outline" onClick={() => removeCoupon.mutate()}>
                Remove
              </Button>
            ) : (
              <Button onClick={() => applyCoupon.mutate(code)} disabled={!code} loading={applyCoupon.isPending}>
                Apply
              </Button>
            )}
          </div>

          {totals && (
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.itemsTotal)} />
              {totals.discountTotal > 0 && (
                <Row label="Discount" value={`- ${formatCurrency(totals.discountTotal)}`} accent />
              )}
              <Row label="Shipping" value={totals.shippingFee === 0 ? 'Free' : formatCurrency(totals.shippingFee)} />
              <Row label="Tax" value={formatCurrency(totals.taxTotal)} />
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatCurrency(totals.grandTotal)}</dd>
              </div>
            </dl>
          )}

          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">Free delivery on orders over $50</p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? 'font-medium text-[hsl(var(--success))]' : 'font-medium'}>{value}</dd>
    </div>
  );
}
