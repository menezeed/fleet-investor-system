'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { VehicleFinancialSummary } from '@/types/database';

export function VehicleReportTable({
  rows,
  locale,
}: {
  rows: VehicleFinancialSummary[];
  locale: 'pt' | 'en';
}) {
  const columns: Column<VehicleFinancialSummary>[] = [
    { header: 'Placa', accessor: (v) => <span className="font-medium">{v.plate_number}</span> },
    { header: 'Veículo', accessor: (v) => `${v.brand} ${v.model}` },
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
      header: 'Lucro c/ Depreciação',
      align: 'right',
      accessor: (v) => formatCurrency(v.accumulated_depreciated_profit, locale),
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
    />
  );
}
