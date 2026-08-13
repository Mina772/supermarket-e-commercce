'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryGrid(): JSX.Element {
  const { data, isLoading } = useCategories();
  const categories = data?.items ?? [];

  return (
    <section className="container mt-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
          <p className="text-muted-foreground">Find exactly what you need, faster.</p>
        </div>
        <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
          : categories.slice(0, 12).map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-2xl">🛒</span>
                  )}
                </div>
                <span className="text-sm font-medium group-hover:text-primary">{cat.name}</span>
              </Link>
            ))}
      </div>
    </section>
  );
}
