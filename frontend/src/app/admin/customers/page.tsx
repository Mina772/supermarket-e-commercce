'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import type { Role, User } from '@/types';

const ROLES: Role[] = ['customer', 'manager', 'admin'];

export default function AdminCustomersPage(): JSX.Element {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => api.users.list({ page, ...(search ? { search } : {}) }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.users.setRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.users.setStatus(id, isActive),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const users = data?.items ?? [];
  const totalPages = Number(data?.meta?.totalPages ?? 1);

  const columns: Column<User>[] = [
    {
      header: 'Customer',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(u.firstName, u.lastName)}
          </span>
          <div>
            <p className="font-medium">{u.firstName} {u.lastName}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (u) =>
        isAdmin ? (
          <select
            className="h-9 rounded-lg border bg-background px-2 text-xs capitalize"
            value={u.role}
            onChange={(e) => setRole.mutate({ id: u._id ?? u.id, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant="outline" className="capitalize">{u.role}</Badge>
        ),
    },
    { header: 'Verified', cell: (u) => (u.isEmailVerified ? 'Yes' : 'No') },
    { header: 'Joined', cell: (u) => formatDate(u.createdAt) },
    {
      header: 'Status',
      cell: (u) => <Badge variant={u.isActive ? 'outline' : 'destructive'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (u) =>
        isAdmin ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatus.mutate({ id: u._id ?? u.id, isActive: !u.isActive })}
          >
            {u.isActive ? 'Disable' : 'Enable'}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Input
          placeholder="Search by name or email…"
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <DataTable columns={columns} rows={users} isLoading={isLoading} rowKey={(u) => u._id ?? u.id} emptyLabel="No customers" />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
