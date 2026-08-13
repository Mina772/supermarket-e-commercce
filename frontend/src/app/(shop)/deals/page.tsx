'use client';

import { useDeals, useFlashSales } from '@/hooks/use-storefront';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-grid';
import { EmptyState } from '@/components/shared/empty-state';

export default function DealsPage(): JSX.Element {
  const flash = useFlashSales(20);
  const deals = useDeals(40);

  return (
    <div className="container py-10">
      <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-12 text-white">
        <h1 className="text-4xl font-black tracking-tight">🔥 Deals &amp; Flash Sales</h1>
        <p className="mt-2 max-w-xl text-white/90">
          Save big on your favourites. Limited-time offers refreshed daily — don&apos;t miss out.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">⚡ Flash sales</h2>
        {flash.isLoading ? (
          <ProductGridSkeleton count={5} />
        ) : (flash.data?.length ?? 0) === 0 ? (
          <EmptyState title="No flash sales right now" description="Check back soon for new lightning deals." />
        ) : (
          <ProductGrid products={flash.data ?? []} />
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Today&apos;s deals</h2>
        {deals.isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : (deals.data?.length ?? 0) === 0 ? (
          <EmptyState title="No deals right now" description="Check back soon for new offers." />
        ) : (
          <ProductGrid products={deals.data ?? []} />
        )}
      </section>
    </div>
  );
}
