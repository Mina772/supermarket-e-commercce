import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-700 lg:block">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-black/10 blur-3xl" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <ShoppingBag className="h-6 w-6" />
            </span>
            {siteConfig.name}
          </Link>
          <div>
            <h2 className="text-4xl font-black leading-tight">Fresh groceries,<br />delivered to your door.</h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              Join thousands of happy shoppers enjoying premium quality, exclusive deals and lightning-fast delivery.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/70">© {new Date().getFullYear()} {siteConfig.name}</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
