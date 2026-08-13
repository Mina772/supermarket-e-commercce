'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { useCategories } from '@/hooks/use-products';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';

export default function AdminCategoriesPage(): JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading } = useCategories();

  const remove = useMutation({
    mutationFn: (id: string) => api.categories.remove(id),
    onSuccess: () => {
      toast.success('Category deleted');
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const categories = data?.items ?? [];

  const columns: Column<Category>[] = [
    { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
    { header: 'Slug', cell: (c) => <span className="text-xs text-muted-foreground">{c.slug}</span> },
    { header: 'Products', cell: (c) => c.productCount ?? 0 },
    { header: 'Featured', cell: (c) => (c.isFeatured ? 'Yes' : 'No') },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete"
          onClick={() => {
            if (confirm(`Delete "${c.name}"?`)) remove.mutate(c._id);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
      <DataTable columns={columns} rows={categories} isLoading={isLoading} rowKey={(c) => c._id} emptyLabel="No categories" />
    </div>
  );
}
