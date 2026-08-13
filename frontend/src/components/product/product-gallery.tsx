'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function ProductGallery({ product }: { product: Product }): JSX.Element {
  const images = product.images?.length ? product.images.map((i) => i.url) : [product.thumbnail ?? '/placeholder.svg'];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <div className="flex gap-3 sm:flex-col">
        {images.slice(0, 6).map((src, i) => (
          <button
            key={src + i}
            onClick={() => setActive(i)}
            className={cn(
              'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition',
              active === i ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
            )}
            aria-label={`View image ${i + 1}`}
          >
            <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border bg-muted">
        <Image
          src={images[active]}
          alt={product.name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
