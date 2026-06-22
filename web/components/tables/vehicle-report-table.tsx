'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { VehicleFinancialSummary } from '@/types/database';

type VehicleReportRow = VehicleFinancialSummary & {
  current_driver_name: string | null;
  occupancy_status: 'occupied' | 'maintenance' | 'idle';
};

export function VehicleReportTable({
  rows,
  locale,
}: {
  rows: VehicleReportRow[];
  locale: 'pt' | 'en';
}) {
  const router = useRouter();

  const columns: Column<VehicleReportRow>[] = [
    { header: 'Placa', accessor: (v) => <span className="font-medium">{v.plate_number}</span> },
    { header: 'Veículo', accessor: (v) => `${v.brand} ${v.model}` },
    { header: 'Motorista Atual', accessor: (v) => v.current_driver_name ?? '—' },
    {
      header: 'Ocupação',
      align: 'center',
      accessor: (v) => <Badge variant={statusToVariant(v.occupancy_status)}>{v.occupancy_status}</Badge>,
    },
    { header: 'Receita Total', align: 'right', accessor: (v) => formatCurrency(v.total_revenue, locale) },
    { header: 'Despesa Total', align: 'right', accessor: (v) => formatCurrency(v.total_expenses, locale) },
    {
      header: 'Lucro Acumulado',
      align: 'right',
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
      accessor: (v) => (
        <span className={v.depreciation >= 0 ? 'text-success' : 'text-destructive'}>
          {formatCurrency(v.depreciation, locale)}
        </span>
      ),
    },
    {
      header: 'Lucro c/ Depreciação',
      align: 'right',
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
      accessor: (v) => (v.roi_percentage != null ? formatPercentage(v.roi_percentage, locale) : '—'),
    },
    {
      header: 'ROI Depreciado',
      align: 'right',
      accessor: (v) =>
        v.roi_depreciated_percentage != null ? formatPercentage(v.roi_depreciated_percentage, locale) : '—',
    },
    {
      header: 'Valor de Mercado',
      align: 'right',
      accessor: (v) => (v.current_market_value ? formatCurrency(v.current_market_value, locale) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(v) => v.vehicle_id}
      emptyMessage="Nenhum veículo cadastrado"
      // CR-014: clicking a vehicle opens its detail screen with full transaction history
      onRowClick={(v) => router.push(`/reports/vehicles/${v.vehicle_id}`)}
    />
  );
}
