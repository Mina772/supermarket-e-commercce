'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useCompareStore } from '@/store/ui-store';
import { useCartMutations } from '@/hooks/use-cart';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/shared/rating-stars';
import { finalPrice, formatCurrency, productImage } from '@/lib/utils';
import type { Brand } from '@/types';

export default function ComparePage(): JSX.Element {
  const compare = useCompareStore();
  const { addItem } = useCartMutations();
  const products = compare.items;

  if (products.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title="No products to compare"
          description="Add products to compare their features side by side."
          action={
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const rows: { label: string; render: (p: (typeof products)[number]) => React.ReactNode }[] = [
    { label: 'Price', render: (p) => <span className="font-semibold">{formatCurrency(finalPrice(p))}</span> },
    { label: 'Brand', render: (p) => (typeof p.brand === 'object' ? (p.brand as Brand).name : '—') },
    { label: 'Rating', render: (p) => <RatingStars value={p.rating} count={p.reviewCount} size={14} /> },
    { label: 'Stock', render: (p) => (p.stock > 0 ? `${p.stock} in stock` : 'Out of stock') },
    { label: 'Unit', render: (p) => p.unit },
    { label: 'Sold', render: (p) => `${p.soldCount}` },
  ];

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Compare products</h1>
        <Button variant="ghost" onClick={() => compare.clear()}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-32" />
              {products.map((p) => (
                <th key={p._id} className="p-4 align-top">
                  <div className="relative">
                    <button
                      className="absolute -right-1 -top-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-muted hover:bg-destructive hover:text-white"
                      onClick={() => compare.remove(p._id)}
                      aria-label="Remove from compare"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/products/${p.slug}`}>
                      <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-xl bg-muted">
                        <Image src={productImage(p)} alt={p.name} fill className="object-cover" sizes="128px" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium">{p.name}</p>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-t p-4 text-sm font-medium text-muted-foreground">{row.label}</td>
                {products.map((p) => (
                  <td key={p._id} className="border-t p-4 text-center text-sm">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border-t p-4" />
              {products.map((p) => (
                <td key={p._id} className="border-t p-4 text-center">
                  <Button size="sm" disabled={p.stock <= 0} onClick={() => addItem.mutate({ productId: p._id, quantity: 1 })}>
                    Add to cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
