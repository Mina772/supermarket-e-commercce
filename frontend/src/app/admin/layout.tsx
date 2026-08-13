'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/customers', label: 'Customers', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { isStaff, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/login?redirect=/admin');
    else if (!isStaff) router.replace('/');
  }, [isLoading, isAuthenticated, isStaff, router]);

  if (isLoading || !isStaff) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading admin…</div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6 font-bold">
          <BarChart3 className="h-5 w-5 text-primary" /> Admin
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/admin" className="font-bold">Admin</Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right text-sm">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-3 py-2 lg:hidden">
          {nav.map((item) => {
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
