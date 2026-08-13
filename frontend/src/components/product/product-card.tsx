'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, GitCompare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/shared/rating-stars';
import { Price } from '@/components/shared/price';
import { cn, finalPrice, productImage } from '@/lib/utils';
import { useCartMutations } from '@/hooks/use-cart';
import { useWishlistMutations } from '@/hooks/use-wishlist';
import { useCompareStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }): JSX.Element {
  const { addItem } = useCartMutations();
  const wishlist = useWishlistMutations();
  const compare = useCompareStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const price = finalPrice(product);
  const outOfStock = product.stock <= 0;
  const inCompare = compare.has(product._id);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="group card-hover relative flex h-full flex-col overflow-hidden">
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.discountPercentage > 0 && <Badge variant="destructive">-{product.discountPercentage}%</Badge>}
          {product.isFlashSale && <Badge variant="accent">⚡ Flash</Badge>}
          {product.isBestSeller && <Badge variant="success">Best Seller</Badge>}
        </div>

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {isAuthenticated && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow"
              aria-label="Add to wishlist"
              onClick={() => wishlist.add.mutate(product._id)}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant={inCompare ? 'default' : 'secondary'}
            className="h-8 w-8 rounded-full shadow"
            aria-label="Compare"
            onClick={() => compare.toggle(product)}
          >
            <GitCompare className="h-4 w-4" />
          </Button>
        </div>

        <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
          <Image
            src={productImage(product)}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className={cn('object-cover transition-transform duration-500 group-hover:scale-105', outOfStock && 'opacity-50')}
          />
          {outOfStock && (
            <div className="absolute inset-0 grid place-items-center">
              <Badge variant="outline" className="bg-background">Out of stock</Badge>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {typeof product.brand === 'object' && product.brand && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</span>
          )}
          <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
            {product.name}
          </Link>
          <RatingStars value={product.rating} count={product.reviewCount} size={14} />
          <div className="mt-auto flex items-center justify-between pt-2">
            <Price price={price} compareAtPrice={product.compareAtPrice} discountPercentage={product.discountPercentage} />
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          <Button
            className="mt-2 w-full"
            size="sm"
            disabled={outOfStock}
            loading={addItem.isPending}
            onClick={() =>
              isAuthenticated
                ? addItem.mutate({ productId: product._id, quantity: 1 })
                : (window.location.href = '/login')
            }
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
