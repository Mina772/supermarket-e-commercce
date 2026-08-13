import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  rowKey: (row: T) => string;
  emptyLabel?: string;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  rowKey,
  emptyLabel = 'No records found',
  skeletonRows = 6,
}: Props<T>): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={cn('whitespace-nowrap px-4 py-3 font-semibold text-muted-foreground', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.header} className="px-4 py-3">
                      <Skeleton className="h-5 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="transition hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col.header} className={cn('px-4 py-3', col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
