'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesPage(): JSX.Element {
  const { data, isLoading } = useCategories();
  const categories = data?.items ?? [];

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
      <p className="mt-1 text-muted-foreground">Browse all departments in our store.</p>

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />)
          : categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:768px) 50vw, 25vw" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-4xl">🛒</span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold group-hover:text-primary">{cat.name}</h2>
                  {cat.productCount !== undefined && (
                    <p className="text-sm text-muted-foreground">{cat.productCount} products</p>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
