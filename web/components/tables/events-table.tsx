'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { SortState } from '@/lib/utils/use-sortable';

export interface EventRow {
  id: string;
  planned_date: string | null;
  value: number | null;
  mileage: number | null;
  is_completed: boolean;
  vehicles: { plate_number: string } | null;
  lookup_expense_types: { label: string } | null;
}

// CR-010 (v1.3): sortable grid (server-side — see app/(dashboard)/events/page.tsx).
export function EventsTable({
  events,
  emptyMessage,
  sort,
  onSortChange,
}: {
  events: EventRow[];
  emptyMessage: string;
  sort: SortState;
  onSortChange: (column: string) => void;
}) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<EventRow>[] = [
    {
      header: 'Data',
      sortKey: 'planned_date',
      accessor: (e) => (e.planned_date ? formatDate(e.planned_date, locale) : '—'),
    },
    { header: 'Veículo', accessor: (e) => e.vehicles?.plate_number ?? '—' },
    { header: 'Tipo de Evento', accessor: (e) => e.lookup_expense_types?.label ?? '—' },
    {
      header: 'Valor',
      align: 'right',
      sortKey: 'value',
      accessor: (e) => (e.value ? formatCurrency(e.value, locale) : '—'),
    },
    {
      header: 'Quilometragem',
      align: 'right',
      sortKey: 'mileage',
      accessor: (e) => (e.mileage != null ? new Intl.NumberFormat('pt-BR').format(e.mileage) : '—'),
    },
    {
      header: 'Status',
      align: 'center',
      sortKey: 'is_completed',
      accessor: (e) => (
        <Badge variant={e.is_completed ? 'success' : 'warning'}>
          {e.is_completed ? 'Concluído' : 'Planejado'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={events}
      keyExtractor={(e) => e.id}
      emptyMessage={emptyMessage}
      onRowClick={(e) => router.push(`/events/${e.id}/edit`)}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
