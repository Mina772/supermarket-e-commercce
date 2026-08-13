import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ShopLayout from '@/app/(shop)/layout';
import AuthLayout from '@/app/(auth)/layout';
import AccountLayout from '@/app/account/layout';
import AdminLayout from '@/app/admin/layout';
import HomePage from '@/app/(shop)/page';
import ProductsPage from '@/app/(shop)/products/page';
import ProductPage from '@/app/(shop)/products/[slug]/page';
import DealsPage from '@/app/(shop)/deals/page';
import CategoriesPage from '@/app/(shop)/categories/page';
import BrandsPage from '@/app/(shop)/brands/page';
import CartPage from '@/app/(shop)/cart/page';
import CheckoutPage from '@/app/(shop)/checkout/page';
import ComparePage from '@/app/(shop)/compare/page';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import AccountPage from '@/app/account/page';
import OrdersPage from '@/app/account/orders/page';
import OrderPage from '@/app/account/orders/[id]/page';
import AddressesPage from '@/app/account/addresses/page';
import WishlistPage from '@/app/account/wishlist/page';
import AdminPage from '@/app/admin/page';
import AdminProductsPage from '@/app/admin/products/page';
import AdminOrdersPage from '@/app/admin/orders/page';
import AdminCategoriesPage from '@/app/admin/categories/page';
import AdminInventoryPage from '@/app/admin/inventory/page';
import AdminCouponsPage from '@/app/admin/coupons/page';
import AdminReviewsPage from '@/app/admin/reviews/page';
import AdminCustomersPage from '@/app/admin/customers/page';
import NotFoundPage from '@/app/not-found';

function LayoutRoute({ Layout }: { Layout: ({ children }: { children: React.ReactNode }) => JSX.Element }): JSX.Element {
  return <Layout><Outlet /></Layout>;
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route element={<LayoutRoute Layout={ShopLayout} />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="compare" element={<ComparePage />} />
      </Route>
      <Route element={<LayoutRoute Layout={AuthLayout} />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="account" element={<LayoutRoute Layout={AccountLayout} />}>
        <Route index element={<AccountPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
      </Route>
      <Route path="admin" element={<LayoutRoute Layout={AdminLayout} />}>
        <Route index element={<AdminPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
      </Route>
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}