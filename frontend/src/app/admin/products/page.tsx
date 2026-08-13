'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { useProducts } from '@/hooks/use-products';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { finalPrice, formatCurrency, productImage } from '@/lib/utils';
import type { Brand, Product } from '@/types';

export default function AdminProductsPage(): JSX.Element {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useProducts({ page, limit: 12, search: search || undefined, sort: '-createdAt' });

  const remove = useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onSuccess: () => {
      toast.success('Product deleted');
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const products = data?.items ?? [];
  const totalPages = Number(data?.meta?.totalPages ?? 1);

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={productImage(p)} alt={p.name} fill className="object-cover" sizes="40px" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{typeof p.brand === 'object' ? (p.brand as Brand).name : '—'}</p>
          </div>
        </div>
      ),
    },
    { header: 'SKU', cell: (p) => <span className="text-xs text-muted-foreground">{p.sku}</span> },
    { header: 'Price', cell: (p) => <span className="font-semibold">{formatCurrency(finalPrice(p))}</span> },
    {
      header: 'Stock',
      cell: (p) => (
        <Badge variant={p.stock <= 0 ? 'destructive' : p.stock < 10 ? 'secondary' : 'outline'}>{p.stock}</Badge>
      ),
    },
    { header: 'Sold', cell: (p) => p.soldCount },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button asChild size="icon" variant="ghost" aria-label="View">
            <Link href={`/products/${p.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete"
            onClick={() => {
              if (confirm(`Delete "${p.name}"?`)) remove.mutate(p._id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Input
          placeholder="Search products…"
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <DataTable columns={columns} rows={products} isLoading={isLoading} rowKey={(p) => p._id} emptyLabel="No products found" />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
