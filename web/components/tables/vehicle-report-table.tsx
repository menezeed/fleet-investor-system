'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';
import type { VehicleFinancialSummary } from '@/types/database';

type VehicleReportRow = VehicleFinancialSummary & {
  current_driver_name: string | null;
  occupancy_status: 'occupied' | 'maintenance' | 'idle';
};

// CR-010 (v1.3): sortable grid.
export function VehicleReportTable({
  rows,
  locale,
}: {
  rows: VehicleReportRow[];
  locale: 'pt' | 'en';
}) {
  const router = useRouter();
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: VehicleReportRow, column: string) => {
    switch (column) {
      case 'plate':
        return row.plate_number;
      case 'name':
        return `${row.brand} ${row.model}`;
      case 'driver':
        return row.current_driver_name;
      case 'occupancy':
        return row.occupancy_status;
      case 'revenue':
        return row.total_revenue;
      case 'expenses':
        return row.total_expenses;
      case 'profit':
        return row.accumulated_profit;
      case 'depreciation':
        return row.depreciation;
      case 'depreciated_profit':
        return row.accumulated_depreciated_profit;
      case 'roi':
        return row.roi_percentage;
      case 'roi_depreciated':
        return row.roi_depreciated_percentage;
      case 'market_value':
        return row.current_market_value;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(rows, sort, getValue);

  const columns: Column<VehicleReportRow>[] = [
    { header: 'Placa', sortKey: 'plate', accessor: (v) => <span className="font-medium">{v.plate_number}</span> },
    { header: 'Veículo', sortKey: 'name', accessor: (v) => `${v.brand} ${v.model}` },
    { header: 'Motorista Atual', sortKey: 'driver', accessor: (v) => v.current_driver_name ?? '—' },
    {
      header: 'Ocupação',
      align: 'center',
      sortKey: 'occupancy',
      accessor: (v) => <Badge variant={statusToVariant(v.occupancy_status)}>{v.occupancy_status}</Badge>,
    },
    {
      header: 'Receita Total',
      align: 'right',
      sortKey: 'revenue',
      accessor: (v) => formatCurrency(v.total_revenue, locale),
    },
    {
      header: 'Despesa Total',
      align: 'right',
      sortKey: 'expenses',
      accessor: (v) => formatCurrency(v.total_expenses, locale),
    },
    {
      header: 'Lucro Acumulado',
      align: 'right',
      sortKey: 'profit',
      accessor: (v) => (
        <span className={v.accumulated_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(v.accumulated_profit, locale)}
        </span>
      ),
    },
    {
      // CR-014: Depreciation = Current Market Value - Acquisition Value (signed)
      header: 'Depreciação',
      align: 'right',
      sortKey: 'depreciation',
      accessor: (v) => (
        <span className={v.depreciation >= 0 ? 'text-success' : 'text-destructive'}>
          {formatCurrency(v.depreciation, locale)}
        </span>
      ),
    },
    {
      header: 'Lucro c/ Depreciação',
      align: 'right',
      sortKey: 'depreciated_profit',
      accessor: (v) => (
        <span
          className={
            v.accumulated_depreciated_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'
          }
        >
          {formatCurrency(v.accumulated_depreciated_profit, locale)}
        </span>
      ),
    },
    {
      header: 'ROI',
      align: 'right',
      sortKey: 'roi',
      accessor: (v) => (v.roi_percentage != null ? formatPercentage(v.roi_percentage, locale) : '—'),
    },
    {
      header: 'ROI Depreciado',
      align: 'right',
      sortKey: 'roi_depreciated',
      accessor: (v) =>
        v.roi_depreciated_percentage != null ? formatPercentage(v.roi_depreciated_percentage, locale) : '—',
    },
    {
      header: 'Valor de Mercado',
      align: 'right',
      sortKey: 'market_value',
      accessor: (v) => (v.current_market_value ? formatCurrency(v.current_market_value, locale) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(v) => v.vehicle_id}
      emptyMessage="Nenhum veículo cadastrado"
      // CR-014: clicking a vehicle opens its detail screen with full transaction history
      onRowClick={(v) => router.push(`/reports/vehicles/${v.vehicle_id}`)}
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
