'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-grid';
import { ProductFilters, type FilterState } from '@/components/product/product-filters';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { ProductQuery } from '@/lib/api';

const SORTS: { label: string; value: string }[] = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'finalPrice' },
  { label: 'Price: High to Low', value: '-finalPrice' },
  { label: 'Top rated', value: '-rating' },
  { label: 'Best selling', value: '-soldCount' },
];

function ProductsView(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();

  const filters: FilterState = useMemo(
    () => ({
      category: params.get('category') ?? undefined,
      brand: params.get('brand') ?? undefined,
      minPrice: params.get('minPrice') ?? undefined,
      maxPrice: params.get('maxPrice') ?? undefined,
      minRating: params.get('minRating') ?? undefined,
      inStock: params.get('inStock') ?? undefined,
      onDeal: params.get('onDeal') ?? undefined,
    }),
    [params],
  );
  const page = Number(params.get('page') ?? '1');
  const sort = params.get('sort') ?? '-createdAt';
  const search = params.get('search') ?? undefined;

  const setParams = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      });
      if (resetPage && !('page' in patch)) next.delete('page');
      router.push(`/products?${next.toString()}`);
    },
    [params, router],
  );

  const query: ProductQuery = {
    page,
    limit: 12,
    sort,
    search,
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    inStock: filters.inStock,
    onDeal: filters.onDeal,
  };

  const { data, isLoading, isFetching } = useProducts(query);
  const products = data?.items ?? [];
  const totalPages = Number(data?.meta?.totalPages ?? 1);
  const total = Number(data?.meta?.total ?? products.length);

  const reset = () => router.push('/products');

  const filterProps = {
    value: filters,
    onChange: (patch: Partial<FilterState>) => setParams(patch as Record<string, string | undefined>),
    onReset: reset,
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {search ? `Results for “${search}”` : 'All products'}
        </h1>
        <p className="text-muted-foreground">{total} products found</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-64 shrink-0 lg:block">
          <ProductFilters {...filterProps} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ProductFilters {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-muted-foreground">
                Sort by
              </label>
              <select
                id="sort"
                className="h-9 rounded-lg border bg-background px-3 text-sm"
                value={sort}
                onChange={(e) => setParams({ sort: e.target.value })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try adjusting your filters or search terms." />
          ) : (
            <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
              <ProductGrid products={products} />
            </div>
          )}

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onChange={(p) => setParams({ page: String(p) }, false)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="container py-8"><ProductGridSkeleton count={12} /></div>}>
      <ProductsView />
    </Suspense>
  );
}
