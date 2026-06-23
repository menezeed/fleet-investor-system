'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { SortState } from '@/lib/utils/use-sortable';

export interface AssignmentRow {
  id: string;
  start_date: string;
  end_date: string | null;
  weekly_rental_value: number;
  plate_number: string;
  vehicle_name: string;
  driver_name: string;
}

// CR-003 (v1.3): table shows exactly Veículo, Motorista, Início, Término,
// Valor Semanal, Status — no Ações column. CR-004: clicking any row opens
// the edit screen (ending an active assignment now lives inside that screen).
export function AssignmentsTable({
  assignments,
  emptyMessage,
  sort,
  onSortChange,
}: {
  assignments: AssignmentRow[];
  emptyMessage: string;
  sort: SortState;
  onSortChange: (column: string) => void;
}) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<AssignmentRow>[] = [
    {
      header: 'Veículo',
      sortKey: 'vehicle_name',
      accessor: (a) => `${a.vehicle_name} - ${a.plate_number}`,
    },
    { header: 'Motorista', sortKey: 'driver_name', accessor: (a) => a.driver_name },
    { header: 'Início', sortKey: 'start_date', accessor: (a) => formatDate(a.start_date, locale) },
    {
      header: 'Término',
      sortKey: 'end_date',
      accessor: (a) => (a.end_date ? formatDate(a.end_date, locale) : '—'),
    },
    {
      header: 'Valor Semanal',
      align: 'right',
      sortKey: 'weekly_rental_value',
      accessor: (a) => formatCurrency(a.weekly_rental_value, locale),
    },
    {
      header: 'Status',
      align: 'center',
      accessor: (a) => (
        <Badge variant={a.end_date ? 'default' : 'success'}>{a.end_date ? 'Encerrada' : 'Ativa'}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={assignments}
      keyExtractor={(a) => a.id}
      emptyMessage={emptyMessage}
      onRowClick={(a) => router.push(`/assignments/${a.id}/edit`)}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
