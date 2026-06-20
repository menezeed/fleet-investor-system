'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export interface EventRow {
  id: string;
  description: string;
  planned_date: string | null;
  value: number | null;
  is_completed: boolean;
  vehicles: { plate_number: string } | null;
}

export function EventsTable({ events, emptyMessage }: { events: EventRow[]; emptyMessage: string }) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<EventRow>[] = [
    { header: 'Veículo', accessor: (e) => e.vehicles?.plate_number ?? '—' },
    { header: 'Descrição', accessor: (e) => e.description },
    { header: 'Data Planejada', accessor: (e) => (e.planned_date ? formatDate(e.planned_date, locale) : '—') },
    { header: 'Valor', align: 'right', accessor: (e) => (e.value ? formatCurrency(e.value, locale) : '—') },
    {
      header: 'Status',
      align: 'center',
      accessor: (e) => (
        <Badge variant={e.is_completed ? 'success' : 'warning'}>
          {e.is_completed ? 'Concluído' : 'Pendente'}
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
    />
  );
}
