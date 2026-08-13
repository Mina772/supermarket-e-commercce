import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { siteConfig } from '@/config/site';

const columns = [
  { title: 'Shop', links: [['All Products', '/products'], ['Categories', '/categories'], ['Brands', '/brands'], ['Deals', '/deals']] },
  { title: 'Account', links: [['My Account', '/account'], ['Orders', '/account/orders'], ['Wishlist', '/account/wishlist'], ['Sign in', '/login']] },
  { title: 'Company', links: [['About Us', '/about'], ['Careers', '/careers'], ['Contact', '/contact'], ['Blog', '/blog']] },
  { title: 'Support', links: [['Help Center', '/help'], ['Shipping', '/shipping'], ['Returns', '/returns'], ['Privacy', '/privacy']] },
];

export function Footer(): JSX.Element {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <ShoppingBag className="h-5 w-5" />
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>Built with Next.js, TypeScript &amp; MongoDB.</p>
        </div>
      </div>
    </footer>
  );
}
