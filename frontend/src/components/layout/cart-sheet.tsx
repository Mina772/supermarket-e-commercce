'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { QuantitySelector } from '@/components/shared/quantity-selector';
import { EmptyState } from '@/components/shared/empty-state';
import { useCart, useCartMutations } from '@/hooks/use-cart';
import { useUiStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, productImage } from '@/lib/utils';

export function CartSheet(): JSX.Element {
  const isOpen = useUiStore((s) => s.isCartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useCart();
  const { updateItem, removeItem } = useCartMutations();

  const items = data?.cart.items ?? [];
  const totals = data?.totals;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {!isAuthenticated ? (
          <div className="p-6">
            <EmptyState
              title="Please sign in"
              description="Log in to view and manage your cart."
              action={
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/login">Sign in</Link>
                </Button>
              }
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              description="Browse fresh products and add them to your cart."
              action={
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/products">Start shopping</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {items.map((item) => (
                <div key={item.product._id} className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={productImage(item.product)} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary" onClick={() => setOpen(false)}>
                      {item.product.name}
                    </Link>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(item.priceSnapshot)}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantitySelector
                        value={item.quantity}
                        max={item.product.stock}
                        onChange={(q) => updateItem.mutate({ productId: item.product._id, quantity: q })}
                      />
                      <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => removeItem.mutate(item.product._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t p-6">
              {totals && (
                <div className="space-y-1 text-sm">
                  <Row label="Subtotal" value={formatCurrency(totals.itemsTotal)} />
                  {totals.discountTotal > 0 && <Row label="Discount" value={`- ${formatCurrency(totals.discountTotal)}`} accent />}
                  <Row label="Shipping" value={totals.shippingFee === 0 ? 'Free' : formatCurrency(totals.shippingFee)} />
                  <Row label="Tax" value={formatCurrency(totals.taxTotal)} />
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              )}
              <Button asChild className="w-full" size="lg" onClick={() => setOpen(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'font-medium text-[hsl(var(--success))]' : 'font-medium'}>{value}</span>
    </div>
  );
}
