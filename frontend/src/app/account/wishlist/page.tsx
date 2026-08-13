'use client';

import Link from 'next/link';
import { useWishlist } from '@/hooks/use-wishlist';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export default function WishlistPage(): JSX.Element {
  const { data, isLoading } = useWishlist();
  const products = data ?? [];

  if (isLoading) return <ProductGridSkeleton count={6} />;

  if (products.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save products you love to find them here later."
        action={
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Saved items ({products.length})</h2>
      <ProductGrid products={products} />
    </div>
  );
}
