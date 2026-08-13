import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { api } from '@/lib/api';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/products', '/categories', '/brands', '/deals', '/login', '/register',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));

  try {
    const { data } = await api.products.list({ limit: 200, sort: '-createdAt' });
    const productRoutes: MetadataRoute.Sitemap = data.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.createdAt ?? Date.now()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
