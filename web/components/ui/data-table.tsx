import { ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SortState } from '@/lib/utils/use-sortable';

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** CR-010: enables sorting on this column. Pass the field name used by the sort state/query. */
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage: string;
  onRowClick?: (row: T) => void;
  /** CR-010: current sort state. Omit to disable sorting entirely, even if columns define sortKey. */
  sort?: SortState;
  onSortChange?: (column: string) => void;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyMessage,
  onRowClick,
  sort,
  onSortChange,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => {
              const sortable = Boolean(col.sortKey && onSortChange);
              const isActive = sortable && sort?.column === col.sortKey;

              return (
                <th
                  key={col.header}
                  onClick={sortable ? () => onSortChange!(col.sortKey as string) : undefined}
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    sortable && 'cursor-pointer select-none hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse',
                      col.align === 'center' && 'justify-center'
                    )}
                  >
                    {col.header}
                    {sortable &&
                      (isActive ? (
                        sort?.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border last:border-0',
                onRowClick && 'cursor-pointer hover:bg-muted/40'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={cn(
                    'px-4 py-2.5 tabular-nums',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
