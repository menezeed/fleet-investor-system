'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { FleetPerformanceRow } from '@/types/database';

export function FleetReportTable({
  rows,
  locale,
}: {
  rows: FleetPerformanceRow[];
  locale: 'pt' | 'en';
}) {
  const columns: Column<FleetPerformanceRow>[] = [
    { header: 'Placa', accessor: (r) => <span className="font-medium">{r.plate_number}</span> },
    { header: 'Motorista', accessor: (r) => r.current_driver_name ?? '—' },
    { header: 'Receita (mês)', align: 'right', accessor: (r) => formatCurrency(r.revenue_month, locale) },
    { header: 'Despesas (mês)', align: 'right', accessor: (r) => formatCurrency(r.expenses_month, locale) },
    {
      header: 'Lucro (mês)',
      align: 'right',
      accessor: (r) => (
        <span className={r.profit_month >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.profit_month, locale)}
        </span>
      ),
    },
    { header: 'Ocupação', align: 'right', accessor: (r) => formatPercentage(r.occupancy_rate, locale) },
    {
      header: 'Status',
      align: 'center',
      accessor: (r) => <Badge variant={statusToVariant(r.occupancy_status)}>{r.occupancy_status}</Badge>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(r) => r.vehicle_id}
      emptyMessage="Nenhum veículo cadastrado"
    />
  );
}
