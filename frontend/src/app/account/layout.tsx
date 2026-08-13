'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, LogOut, MapPin, Package, User as UserIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/layout/cart-sheet';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/account', label: 'Profile', icon: UserIcon },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login?redirect=/account');
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="container flex-1 py-10">
        <h1 className="text-3xl font-bold tracking-tight">My account</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit space-y-1 rounded-2xl border bg-card p-3">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
      <CartSheet />
    </div>
  );
}
