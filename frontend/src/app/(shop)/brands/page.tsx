'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useBrands } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrandsPage(): JSX.Element {
  const { data, isLoading } = useBrands();
  const brands = data?.items ?? [];

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
      <p className="mt-1 text-muted-foreground">Shop your favourite brands.</p>

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
          : brands.map((brand) => (
              <Link
                key={brand._id}
                href={`/products?brand=${brand.slug}`}
                className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-16 w-16">
                  {brand.logo ? (
                    <Image src={brand.logo} alt={brand.name} fill className="object-contain" sizes="64px" />
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium group-hover:text-primary">{brand.name}</span>
              </Link>
            ))}
      </div>
    </div>
  );
}
