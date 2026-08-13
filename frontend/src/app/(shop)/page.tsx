'use client';

import { Hero } from '@/components/home/hero';
import { CategoryGrid } from '@/components/home/category-grid';
import { ProductSection } from '@/components/product/product-carousel';
import { useFeatured, useBestSellers, useDeals, useFlashSales } from '@/hooks/use-storefront';

export default function HomePage(): JSX.Element {
  const featured = useFeatured(10);
  const bestSellers = useBestSellers(10);
  const deals = useDeals(10);
  const flash = useFlashSales(10);

  return (
    <div className="pb-16">
      <Hero />
      <CategoryGrid />

      <ProductSection
        title="⚡ Flash sales"
        subtitle="Limited-time prices — grab them before they're gone."
        products={flash.data ?? []}
        isLoading={flash.isLoading}
        viewAllHref="/deals"
      />
      <ProductSection
        title="Featured products"
        subtitle="Hand-picked favourites from our aisles."
        products={featured.data ?? []}
        isLoading={featured.isLoading}
        viewAllHref="/products?featured=true"
      />
      <ProductSection
        title="Best sellers"
        subtitle="What everyone's adding to their carts."
        products={bestSellers.data ?? []}
        isLoading={bestSellers.isLoading}
        viewAllHref="/products?sort=-soldCount"
      />
      <ProductSection
        title="Today's deals"
        subtitle="Save big on everyday essentials."
        products={deals.data ?? []}
        isLoading={deals.isLoading}
        viewAllHref="/deals"
      />
    </div>
  );
}
