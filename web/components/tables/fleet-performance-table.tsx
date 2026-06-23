'use client';

import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';
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
  // CR-002 (v1.3): rows already come alphabetically sorted by vehicle name
  // from the backend; default sort state mirrors that for the indicator.
  const { sort, toggleSort } = useSortableState({ column: 'vehicle', direction: 'asc' });

  const getValue = (row: FleetPerformanceRow, column: string) => {
    switch (column) {
      case 'vehicle':
        return `${row.brand} ${row.model}`;
      case 'driver':
        return row.current_driver_name;
      case 'revenue':
        return row.revenue_month;
      case 'expenses':
        return row.expenses_month;
      case 'profit':
        return row.profit_month;
      case 'occupancy':
        return row.occupancy_rate;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(rows, sort, getValue);

  // CR-002 (v1.3): "Placa" column replaced by "Veículo" (Brand Model - Plate).
  const columns: Column<FleetPerformanceRow>[] = [
    {
      header: 'Veículo',
      sortKey: 'vehicle',
      accessor: (r) => (
        <span className="font-medium">
          {r.brand} {r.model} - {r.plate_number}
        </span>
      ),
    },
    { header: t('driver'), sortKey: 'driver', accessor: (r) => r.current_driver_name ?? '—' },
    {
      header: t('revenueMonth'),
      align: 'right',
      sortKey: 'revenue',
      accessor: (r) => formatCurrency(r.revenue_month, locale),
    },
    {
      header: t('expensesMonth'),
      align: 'right',
      sortKey: 'expenses',
      accessor: (r) => formatCurrency(r.expenses_month, locale),
    },
    {
      header: t('profit'),
      align: 'right',
      sortKey: 'profit',
      accessor: (r) => (
        <span className={r.profit_month >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.profit_month, locale)}
        </span>
      ),
    },
    {
      header: t('occupancyRate'),
      align: 'right',
      sortKey: 'occupancy',
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

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(r) => r.vehicle_id}
      emptyMessage={emptyMessage}
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
