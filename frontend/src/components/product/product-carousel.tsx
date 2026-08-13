'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './product-card';
import { ProductGridSkeleton } from './product-grid';
import type { Product } from '@/types';

interface Props {
  title: string;
  subtitle?: string;
  products?: Product[];
  isLoading?: boolean;
  viewAllHref?: string;
}

export function ProductSection({ title, subtitle, products, isLoading, viewAllHref }: Props): JSX.Element {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products?.slice(0, 5).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
