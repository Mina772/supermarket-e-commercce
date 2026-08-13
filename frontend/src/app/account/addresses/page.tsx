'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Address } from '@/types';

const schema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(6, 'Required'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().optional(),
  postalCode: z.string().min(3, 'Required'),
  country: z.string().min(2, 'Required'),
  isDefault: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AddressesPage(): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: api.addresses.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses'] });

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      editing?._id ? api.addresses.update(editing._id, values) : api.addresses.create(values as Address),
    onSuccess: () => {
      toast.success(editing ? 'Address updated' : 'Address added');
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (addrId: string) => api.addresses.remove(addrId),
    onSuccess: () => {
      toast.success('Address removed');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const openForm = (address: Address | null) => {
    setEditing(address);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <Button size="sm" onClick={() => openForm(null)}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (addresses?.length ?? 0) === 0 ? (
        <EmptyState icon={MapPin} title="No addresses yet" description="Add a delivery address to speed up checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses?.map((addr) => (
            <div key={addr._id} className="relative rounded-2xl border bg-card p-5">
              {addr.isDefault && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Star className="h-3 w-3 fill-primary" /> Default
                </span>
              )}
              {addr.label && <p className="text-xs font-medium uppercase text-muted-foreground">{addr.label}</p>}
              <p className="mt-1 font-medium">{addr.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country}<br />
                {addr.phone}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openForm(addr)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => addr._id && remove.mutate(addr._id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetTrigger className="hidden" />
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit address' : 'Add address'}</SheetTitle>
          </SheetHeader>
          <AddressForm key={editing?._id ?? 'new'} defaultValues={editing} onSubmit={(v) => save.mutate(v)} loading={save.isPending} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AddressForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues: Address | null;
  onSubmit: (values: FormValues) => void;
  loading: boolean;
}): JSX.Element {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: defaultValues?.label ?? '',
      fullName: defaultValues?.fullName ?? '',
      phone: defaultValues?.phone ?? '',
      line1: defaultValues?.line1 ?? '',
      line2: defaultValues?.line2 ?? '',
      city: defaultValues?.city ?? '',
      state: defaultValues?.state ?? '',
      postalCode: defaultValues?.postalCode ?? '',
      country: defaultValues?.country ?? 'United States',
      isDefault: defaultValues?.isDefault ?? false,
    },
  });

  const isDefault = watch('isDefault');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      {(
        [
          ['label', 'Label (e.g. Home, Work)'],
          ['fullName', 'Full name'],
          ['phone', 'Phone'],
          ['line1', 'Address line 1'],
          ['line2', 'Address line 2'],
          ['city', 'City'],
          ['state', 'State / Region'],
          ['postalCode', 'Postal code'],
          ['country', 'Country'],
        ] as const
      ).map(([name, label]) => (
        <div key={name} className="space-y-1.5">
          <Label>{label}</Label>
          <Input {...register(name)} />
          {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
        </div>
      ))}
      <label className={cn('flex cursor-pointer items-center gap-2 text-sm', isDefault && 'text-primary')}>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border"
          checked={isDefault}
          onChange={(e) => setValue('isDefault', e.target.checked)}
        />
        Set as default address
      </label>
      <Button type="submit" className="w-full" loading={loading}>
        Save address
      </Button>
    </form>
  );
}
