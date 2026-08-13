import type { Metadata } from 'next';
import { ProductDetail } from '@/components/product/product-detail';
import { api } from '@/lib/api';
import { siteConfig } from '@/config/site';
import { finalPrice, productImage } from '@/lib/utils';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await api.products.detail(params.slug);
    const image = productImage(product);
    return {
      title: product.name,
      description: product.shortDescription ?? product.description.slice(0, 160),
      alternates: { canonical: `${siteConfig.url}/products/${product.slug}` },
      openGraph: {
        title: product.name,
        description: product.shortDescription ?? product.description.slice(0, 160),
        images: [{ url: image }],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: PageProps): Promise<JSX.Element> {
  let jsonLd: Record<string, unknown> | null = null;
  try {
    const product = await api.products.detail(params.slug);
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images?.map((i) => i.url) ?? [],
      description: product.description,
      sku: product.sku,
      gtin: product.barcode,
      brand: typeof product.brand === 'object' ? { '@type': 'Brand', name: product.brand?.name } : undefined,
      aggregateRating:
        product.reviewCount > 0
          ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount }
          : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: product.currency || 'USD',
        price: finalPrice(product),
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${siteConfig.url}/products/${product.slug}`,
      },
    };
  } catch {
    jsonLd = null;
  }

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ProductDetail slug={params.slug} />
    </>
  );
}
