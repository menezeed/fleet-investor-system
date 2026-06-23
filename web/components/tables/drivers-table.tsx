'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';

export interface DriverRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  start_date: string;
  lookup_driver_statuses: { code: string; label: string } | null;
}

// CR-010 (v1.3): sortable grid.
export function DriversTable({ drivers, emptyMessage }: { drivers: DriverRow[]; emptyMessage: string }) {
  const router = useRouter();
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: DriverRow, column: string) => {
    switch (column) {
      case 'name':
        return row.full_name;
      case 'phone':
        return row.phone;
      case 'email':
        return row.email;
      case 'start_date':
        return row.start_date;
      case 'status':
        return row.lookup_driver_statuses?.label;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(drivers, sort, getValue);

  const columns: Column<DriverRow>[] = [
    { header: 'Nome', sortKey: 'name', accessor: (d) => <span className="font-medium">{d.full_name}</span> },
    { header: 'Telefone', sortKey: 'phone', accessor: (d) => d.phone ?? '—' },
    { header: 'E-mail', sortKey: 'email', accessor: (d) => d.email ?? '—' },
    { header: 'Início', sortKey: 'start_date', accessor: (d) => d.start_date },
    {
      header: 'Status',
      align: 'center',
      sortKey: 'status',
      accessor: (d) => (
        <Badge variant={statusToVariant(d.lookup_driver_statuses?.code ?? '')}>
          {d.lookup_driver_statuses?.label ?? '—'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(d) => d.id}
      emptyMessage={emptyMessage}
      onRowClick={(d) => router.push(`/drivers/${d.id}/edit`)}
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
