'use client';

import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export interface InvestorVehicleDetailRow {
  vehicle_id: string;
  plate_number: string;
  vehicle_name: string;
  acquisition_date: string;
  total_revenue: number;
  total_expenses: number;
  accumulated_profit: number;
  accumulated_depreciated_profit: number;
  current_market_value: number | null;
}

// CR-014: Investor Detail — each vehicle shows Vehicle Name, License Plate,
// Acquisition Date, Gross Revenue, Total Expenses, Net Profit, Profit
// Including Depreciation, Current Market Value.
export function InvestorVehicleDetailTable({ rows }: { rows: InvestorVehicleDetailRow[] }) {
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<InvestorVehicleDetailRow>[] = [
    { header: 'Veículo', accessor: (r) => <span className="font-medium">{r.vehicle_name}</span> },
    { header: 'Placa', accessor: (r) => r.plate_number },
    { header: 'Data de Aquisição', accessor: (r) => formatDate(r.acquisition_date, locale) },
    { header: 'Receita Bruta', align: 'right', accessor: (r) => formatCurrency(r.total_revenue, locale) },
    { header: 'Despesa Total', align: 'right', accessor: (r) => formatCurrency(r.total_expenses, locale) },
    {
      header: 'Lucro Líquido',
      align: 'right',
      accessor: (r) => (
        <span className={r.accumulated_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.accumulated_profit, locale)}
        </span>
      ),
    },
    {
      header: 'Lucro c/ Depreciação',
      align: 'right',
      accessor: (r) => formatCurrency(r.accumulated_depreciated_profit, locale),
    },
    {
      header: 'Valor de Mercado Atual',
      align: 'right',
      accessor: (r) => (r.current_market_value ? formatCurrency(r.current_market_value, locale) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(r) => r.vehicle_id}
      emptyMessage="Nenhum veículo encontrado para este investidor"
    />
  );
}
