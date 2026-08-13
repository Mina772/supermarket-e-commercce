'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Banknote, CreditCard, Truck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { useCart } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatCurrency } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(6, 'Valid phone required'),
  line1: z.string().min(3, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  notes: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const PAYMENTS = [
  { value: 'cod', label: 'Cash on delivery', icon: Truck },
  { value: 'cash', label: 'Cash in store', icon: Banknote },
  { value: 'stripe', label: 'Credit / Debit card', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', icon: Wallet },
] as const;

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]['value']>('cod');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      country: 'United States',
    },
  });

  const placeOrder = useMutation({
    mutationFn: (values: FormValues) =>
      api.orders.checkout({
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          line1: values.line1,
          line2: values.line2,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
        },
        paymentMethod: payment,
        notes: values.notes,
      }),
    onSuccess: (order) => {
      toast.success('Order placed successfully!');
      router.push(`/account/orders/${order._id}`);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Sign in to checkout"
          action={
            <Button asChild>
              <Link href="/login?redirect=/checkout">Sign in</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const items = cart?.cart.items ?? [];
  const totals = cart?.totals;

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Your cart is empty"
          action={
            <Button asChild>
              <Link href="/products">Continue shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <form
        onSubmit={handleSubmit((v) => placeOrder.mutate(v))}
        className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]"
      >
        <div className="space-y-8">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message}>
                <Input {...register('fullName')} />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <Input {...register('phone')} />
              </Field>
              <Field label="Address line 1" error={errors.line1?.message} className="sm:col-span-2">
                <Input {...register('line1')} />
              </Field>
              <Field label="Address line 2 (optional)" className="sm:col-span-2">
                <Input {...register('line2')} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input {...register('city')} />
              </Field>
              <Field label="State / Region" error={errors.state?.message}>
                <Input {...register('state')} />
              </Field>
              <Field label="Postal code" error={errors.postalCode?.message}>
                <Input {...register('postalCode')} />
              </Field>
              <Field label="Country" error={errors.country?.message}>
                <Input {...register('country')} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENTS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setPayment(p.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                    payment === p.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40',
                  )}
                >
                  <p.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Order notes (optional)</h2>
            <Textarea placeholder="Delivery instructions…" {...register('notes')} rows={3} />
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <li key={item.product._id} className="flex justify-between gap-2 text-sm">
                <span className="line-clamp-1">
                  {item.quantity}× {item.product.name}
                </span>
                <span className="shrink-0 font-medium">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
              </li>
            ))}
          </ul>

          {totals && (
            <dl className="space-y-2 border-t pt-3 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.itemsTotal)} />
              {totals.discountTotal > 0 && <Row label="Discount" value={`- ${formatCurrency(totals.discountTotal)}`} />}
              <Row label="Shipping" value={totals.shippingFee === 0 ? 'Free' : formatCurrency(totals.shippingFee)} />
              <Row label="Tax" value={formatCurrency(totals.taxTotal)} />
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatCurrency(totals.grandTotal)}</dd>
              </div>
            </dl>
          )}

          <Button type="submit" size="lg" className="w-full" loading={placeOrder.isPending}>
            Place order
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By placing your order you agree to our terms &amp; conditions.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
