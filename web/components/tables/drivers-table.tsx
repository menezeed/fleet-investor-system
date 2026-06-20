'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';

export interface DriverRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  start_date: string;
  lookup_driver_statuses: { code: string; label: string } | null;
}

export function DriversTable({ drivers, emptyMessage }: { drivers: DriverRow[]; emptyMessage: string }) {
  const router = useRouter();

  const columns: Column<DriverRow>[] = [
    { header: 'Nome', accessor: (d) => <span className="font-medium">{d.full_name}</span> },
    { header: 'Telefone', accessor: (d) => d.phone ?? '—' },
    { header: 'E-mail', accessor: (d) => d.email ?? '—' },
    { header: 'Início', accessor: (d) => d.start_date },
    {
      header: 'Status',
      align: 'center',
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
      rows={drivers}
      keyExtractor={(d) => d.id}
      emptyMessage={emptyMessage}
      onRowClick={(d) => router.push(`/drivers/${d.id}/edit`)}
    />
  );
}
