'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export interface RevenueRow {
  id: string;
  revenue_date: string;
  amount: number;
  notes: string | null;
  vehicles: { plate_number: string } | null;
  drivers: { full_name: string } | null;
  lookup_revenue_types: { label: string } | null;
}

export function RevenuesTable({ revenues, emptyMessage }: { revenues: RevenueRow[]; emptyMessage: string }) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<RevenueRow>[] = [
    { header: 'Data', accessor: (r) => formatDate(r.revenue_date, locale) },
    { header: 'Veículo', accessor: (r) => r.vehicles?.plate_number ?? '—' },
    { header: 'Motorista', accessor: (r) => r.drivers?.full_name ?? '—' },
    { header: 'Tipo', accessor: (r) => r.lookup_revenue_types?.label ?? '—' },
    {
      header: 'Valor',
      align: 'right',
      accessor: (r) => <span className="text-success font-medium">{formatCurrency(r.amount, locale)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={revenues}
      keyExtractor={(r) => r.id}
      emptyMessage={emptyMessage}
      onRowClick={(r) => router.push(`/revenues/${r.id}/edit`)}
    />
  );
}
