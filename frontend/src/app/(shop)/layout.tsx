import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/layout/cart-sheet';

export default function ShopLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartSheet />
    </div>
  );
}
