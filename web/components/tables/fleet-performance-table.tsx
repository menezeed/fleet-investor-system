'use client';

import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { FleetPerformanceRow } from '@/types/database';

export function FleetPerformanceTable({
  rows,
  locale,
  emptyMessage,
}: {
  rows: FleetPerformanceRow[];
  locale: 'pt' | 'en';
  emptyMessage: string;
}) {
  const t = useTranslations('dashboard');
  const tVehicle = useTranslations('vehicle');

  const columns: Column<FleetPerformanceRow>[] = [
    { header: t('plate'), accessor: (r) => <span className="font-medium">{r.plate_number}</span> },
    { header: t('driver'), accessor: (r) => r.current_driver_name ?? '—' },
    {
      header: t('revenueMonth'),
      align: 'right',
      accessor: (r) => formatCurrency(r.revenue_month, locale),
    },
    {
      header: t('expensesMonth'),
      align: 'right',
      accessor: (r) => formatCurrency(r.expenses_month, locale),
    },
    {
      header: t('profit'),
      align: 'right',
      accessor: (r) => (
        <span className={r.profit_month >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.profit_month, locale)}
        </span>
      ),
    },
    {
      header: t('occupancyRate'),
      align: 'right',
      accessor: (r) => formatPercentage(r.occupancy_rate, locale),
    },
    {
      header: t('occupancyStatus'),
      align: 'center',
      accessor: (r) => (
        <Badge variant={statusToVariant(r.occupancy_status)}>
          {tVehicle(`occupancy.${r.occupancy_status}` as 'occupancy.occupied')}
        </Badge>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} keyExtractor={(r) => r.vehicle_id} emptyMessage={emptyMessage} />;
}
