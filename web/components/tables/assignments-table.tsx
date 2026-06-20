'use client';

import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EndAssignmentButton } from '@/components/forms/end-assignment-button';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export interface AssignmentRow {
  id: string;
  start_date: string;
  end_date: string | null;
  monthly_rental_value: number;
  vehicles: { plate_number: string } | null;
  drivers: { full_name: string } | null;
}

export function AssignmentsTable({
  assignments,
  emptyMessage,
}: {
  assignments: AssignmentRow[];
  emptyMessage: string;
}) {
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<AssignmentRow>[] = [
    { header: 'Veículo', accessor: (a) => a.vehicles?.plate_number ?? '—' },
    { header: 'Motorista', accessor: (a) => a.drivers?.full_name ?? '—' },
    { header: 'Início', accessor: (a) => formatDate(a.start_date, locale) },
    { header: 'Término', accessor: (a) => (a.end_date ? formatDate(a.end_date, locale) : '—') },
    {
      header: 'Valor Mensal',
      align: 'right',
      accessor: (a) => formatCurrency(a.monthly_rental_value, locale),
    },
    {
      header: 'Status',
      align: 'center',
      accessor: (a) => (
        <Badge variant={a.end_date ? 'default' : 'success'}>{a.end_date ? 'Encerrada' : 'Ativa'}</Badge>
      ),
    },
    {
      header: 'Ações',
      align: 'center',
      accessor: (a) => (!a.end_date ? <EndAssignmentButton assignmentId={a.id} /> : null),
    },
  ];

  return (
    <DataTable columns={columns} rows={assignments} keyExtractor={(a) => a.id} emptyMessage={emptyMessage} />
  );
}
