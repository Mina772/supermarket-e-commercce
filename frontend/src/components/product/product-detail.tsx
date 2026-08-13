'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Minus, Plus, Scale, ShoppingCart, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useRelated } from '@/hooks/use-storefront';
import { useCartMutations } from '@/hooks/use-cart';
import { useWishlist, useWishlistMutations } from '@/hooks/use-wishlist';
import { useCompareStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { ProductGallery } from './product-gallery';
import { ProductReviews } from './product-reviews';
import { ProductSection } from './product-carousel';
import { RatingStars } from '@/components/shared/rating-stars';
import { Price } from '@/components/shared/price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, finalPrice } from '@/lib/utils';
import type { Brand, Category } from '@/types';

export function ProductDetail({ slug }: { slug: string }): JSX.Element {
  const { data: product, isLoading } = useProduct(slug);
  const { addItem } = useCartMutations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: wishlist } = useWishlist();
  const { add: addWish, remove: removeWish } = useWishlistMutations();
  const compare = useCompareStore();
  const [qty, setQty] = useState(1);
  const related = useRelated(slug, 10);

  if (isLoading || !product) {
    return (
      <div className="container grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    );
  }

  const brand = typeof product.brand === 'object' ? (product.brand as Brand) : undefined;
  const category = typeof product.category === 'object' ? (product.category as Category) : undefined;
  const inStock = product.stock > 0;
  const wished = (wishlist ?? []).some((p) => p._id === product._id);
  const price = finalPrice(product);
  const toggleWish = () => (wished ? removeWish.mutate(product._id) : addWish.mutate(product._id));

  return (
    <div className="container py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery product={product} />

        <div>
          {brand && (
            <Link href={`/products?brand=${brand.slug}`} className="text-sm font-medium text-primary hover:underline">
              {brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <RatingStars value={product.rating} count={product.reviewCount} />
            <span className="text-sm text-muted-foreground">· {product.soldCount} sold</span>
          </div>

          <div className="mt-5">
            <Price price={price} compareAtPrice={product.compareAtPrice} discountPercentage={product.discountPercentage} size="lg" />
            <p className="mt-1 text-sm text-muted-foreground">Price per {product.unit}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {product.isFlashSale && <Badge variant="destructive">Flash sale</Badge>}
            {product.isOnDeal && <Badge className="bg-orange-500">Deal</Badge>}
            {product.isBestSeller && <Badge variant="secondary">Best seller</Badge>}
            <Badge variant={inStock ? 'outline' : 'destructive'}>
              {inStock ? `In stock (${product.stock})` : 'Out of stock'}
            </Badge>
          </div>

          {product.shortDescription && (
            <p className="mt-5 text-muted-foreground">{product.shortDescription}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border">
              <button
                className="grid h-11 w-11 place-items-center disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                className="grid h-11 w-11 place-items-center disabled:opacity-40"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              disabled={!inStock}
              loading={addItem.isPending}
              onClick={() => addItem.mutate({ productId: product._id, quantity: qty })}
            >
              <ShoppingCart className="h-5 w-5" /> Add to cart
            </Button>

            {isAuthenticated && (
              <Button size="icon" variant="outline" className="h-11 w-11" aria-label="Wishlist" onClick={toggleWish}>
                <Heart className={cn('h-5 w-5', wished && 'fill-red-500 text-red-500')} />
              </Button>
            )}
            <Button
              size="icon"
              variant={compare.has(product._id) ? 'default' : 'outline'}
              className="h-11 w-11"
              aria-label="Compare"
              onClick={() => compare.toggle(product)}
            >
              <Scale className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-3">
            <Feature icon={Truck} title="Free delivery" desc="Orders over $50" />
            <Feature icon={RotateCcw} title="Easy returns" desc="30-day policy" />
            <Feature icon={ShieldCheck} title="Secure payment" desc="Encrypted checkout" />
          </div>
        </div>
      </div>

      {/* Description & nutrition */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="text-xl font-bold">Product details</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
          {product.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Badge key={t} variant="secondary">#{t}</Badge>
              ))}
            </div>
          )}
        </div>

        {product.nutrition && (
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold">Nutrition facts</h3>
            {product.nutrition.servingSize && (
              <p className="text-sm text-muted-foreground">Serving size: {product.nutrition.servingSize}</p>
            )}
            <dl className="mt-3 divide-y text-sm">
              {[
                ['Calories', product.nutrition.calories, 'kcal'],
                ['Fat', product.nutrition.fat, 'g'],
                ['Carbohydrates', product.nutrition.carbohydrates, 'g'],
                ['Sugars', product.nutrition.sugars, 'g'],
                ['Protein', product.nutrition.protein, 'g'],
                ['Fiber', product.nutrition.fiber, 'g'],
                ['Salt', product.nutrition.salt, 'g'],
              ]
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([label, v, unit]) => (
                  <div key={String(label)} className="flex justify-between py-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{String(v)} {unit}</dd>
                  </div>
                ))}
            </dl>
            {product.barcode && (
              <p className="mt-4 text-xs text-muted-foreground">Barcode: {product.barcode}</p>
            )}
          </div>
        )}
      </div>

      <ProductReviews productId={product._id} />

      <ProductSection
        title="You may also like"
        products={related.data ?? []}
        isLoading={related.isLoading}
      />
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Truck; title: string; desc: string }): JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
