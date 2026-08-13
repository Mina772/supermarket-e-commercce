'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Coupon } from '@/types';

const schema = z.object({
  code: z.string().min(3, 'Required').transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Must be > 0'),
  minOrderAmount: z.coerce.number().min(0),
  usageLimit: z.coerce.number().int().min(0).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminCouponsPage(): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: api.coupons.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });

  const create = useMutation({
    mutationFn: (values: FormValues) => api.coupons.create(values),
    onSuccess: () => {
      toast.success('Coupon created');
      invalidate();
      setOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.coupons.remove(id),
    onSuccess: () => {
      toast.success('Coupon deleted');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: 'percentage', minOrderAmount: 0 },
  });

  const coupons = data?.items ?? [];

  const columns: Column<Coupon>[] = [
    { header: 'Code', cell: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    {
      header: 'Discount',
      cell: (c) => (c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)),
    },
    { header: 'Min order', cell: (c) => formatCurrency(c.minOrderAmount) },
    { header: 'Used', cell: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
    { header: 'Status', cell: (c) => <Badge variant={c.isActive ? 'outline' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Expires', cell: (c) => (c.expiresAt ? formatDate(c.expiresAt) : '—') },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete"
          onClick={() => {
            if (confirm(`Delete coupon ${c.code}?`)) remove.mutate(c._id);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <Button size="sm" onClick={() => { reset(); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </div>

      <DataTable columns={columns} rows={coupons} isLoading={isLoading} rowKey={(c) => c._id} emptyLabel="No coupons" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New coupon</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit((v) => create.mutate(v))} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input {...register('code')} placeholder="SUMMER20" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm" {...register('discountType')}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input type="number" step="0.01" {...register('discountValue')} />
                {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min order</Label>
                <Input type="number" step="0.01" {...register('minOrderAmount')} />
              </div>
              <div className="space-y-1.5">
                <Label>Usage limit</Label>
                <Input type="number" {...register('usageLimit')} placeholder="Unlimited" />
              </div>
            </div>
            <Button type="submit" className="w-full" loading={create.isPending}>
              Create coupon
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
