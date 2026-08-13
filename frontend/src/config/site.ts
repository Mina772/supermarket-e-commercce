export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'FreshMart',
  description:
    'FreshMart — your premium online supermarket. Fresh groceries, everyday essentials, and exclusive deals delivered to your door.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: '/og.svg',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'Brands', href: '/brands' },
    { label: 'Deals', href: '/deals' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
