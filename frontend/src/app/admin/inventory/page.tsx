'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, PackageX } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export default function AdminInventoryPage(): JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'low' | 'out'>('low');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const low = useQuery({ queryKey: ['admin', 'inventory', 'low'], queryFn: api.inventory.lowStock });
  const out = useQuery({ queryKey: ['admin', 'inventory', 'out'], queryFn: api.inventory.outOfStock });

  const adjust = useMutation({
    mutationFn: ({ id, change }: { id: string; change: number }) =>
      api.inventory.adjust(id, { change, reason: 'manual-restock' }),
    onSuccess: () => {
      toast.success('Stock updated');
      void qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = tab === 'low' ? low.data ?? [] : out.data ?? [];
  const isLoading = tab === 'low' ? low.isLoading : out.isLoading;

  const columns: Column<Product>[] = [
    { header: 'Product', cell: (p) => <span className="font-medium">{p.name}</span> },
    { header: 'SKU', cell: (p) => <span className="text-xs text-muted-foreground">{p.sku}</span> },
    {
      header: 'Stock',
      cell: (p) => <Badge variant={p.stock <= 0 ? 'destructive' : 'secondary'}>{p.stock}</Badge>,
    },
    {
      header: 'Restock',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            className="h-9 w-24"
            placeholder="+ qty"
            value={drafts[p._id] ?? ''}
            onChange={(e) => setDrafts((d) => ({ ...d, [p._id]: e.target.value }))}
          />
          <Button
            size="sm"
            disabled={!drafts[p._id]}
            onClick={() => {
              const change = Number(drafts[p._id]);
              if (change) adjust.mutate({ id: p._id, change });
              setDrafts((d) => ({ ...d, [p._id]: '' }));
            }}
          >
            Add
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('low')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium',
            tab === 'low' ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted',
          )}
        >
          <AlertTriangle className="h-4 w-4" /> Low stock ({low.data?.length ?? 0})
        </button>
        <button
          onClick={() => setTab('out')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium',
            tab === 'out' ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted',
          )}
        >
          <PackageX className="h-4 w-4" /> Out of stock ({out.data?.length ?? 0})
        </button>
      </div>

      <DataTable columns={columns} rows={rows} isLoading={isLoading} rowKey={(p) => p._id} emptyLabel="All good — nothing to restock" />
    </div>
  );
}
