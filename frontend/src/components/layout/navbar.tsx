'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Heart, LogOut, Menu, Package, Search, ShoppingBag, ShoppingCart, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from './theme-toggle';
import { siteConfig } from '@/config/site';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { useCart } from '@/hooks/use-cart';
import { getInitials } from '@/lib/utils';

export function Navbar(): JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { user, isAuthenticated, isStaff, logout } = useAuthStore();
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const { data: cart } = useCart();
  const cartCount = cart?.cart.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="container flex h-16 items-center gap-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle>{siteConfig.name}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-4">
              {siteConfig.nav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent/10">
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="hidden text-lg sm:inline">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fresh products…"
            className="pl-9"
            aria-label="Search products"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />

          {isAuthenticated && (
            <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
              <Link href="/account/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative" aria-label="Cart" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">{cartCount}</Badge>
            )}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account" className="rounded-full">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account"><UserIcon className="h-4 w-4" /> My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders"><Package className="h-4 w-4" /> Orders</Link>
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><LayoutDashboard className="h-4 w-4" /> Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
