'use client';

import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';

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
// Including Depreciation, Current Market Value. CR-010 (v1.3): sortable.
export function InvestorVehicleDetailTable({ rows }: { rows: InvestorVehicleDetailRow[] }) {
  const locale = useLocale() as 'pt' | 'en';
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: InvestorVehicleDetailRow, column: string) => {
    switch (column) {
      case 'name':
        return row.vehicle_name;
      case 'plate':
        return row.plate_number;
      case 'acquisition_date':
        return row.acquisition_date;
      case 'revenue':
        return row.total_revenue;
      case 'expenses':
        return row.total_expenses;
      case 'profit':
        return row.accumulated_profit;
      case 'depreciated_profit':
        return row.accumulated_depreciated_profit;
      case 'market_value':
        return row.current_market_value;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(rows, sort, getValue);

  const columns: Column<InvestorVehicleDetailRow>[] = [
    { header: 'Veículo', sortKey: 'name', accessor: (r) => <span className="font-medium">{r.vehicle_name}</span> },
    { header: 'Placa', sortKey: 'plate', accessor: (r) => r.plate_number },
    {
      header: 'Data de Aquisição',
      sortKey: 'acquisition_date',
      accessor: (r) => formatDate(r.acquisition_date, locale),
    },
    {
      header: 'Receita Bruta',
      align: 'right',
      sortKey: 'revenue',
      accessor: (r) => formatCurrency(r.total_revenue, locale),
    },
    {
      header: 'Despesa Total',
      align: 'right',
      sortKey: 'expenses',
      accessor: (r) => formatCurrency(r.total_expenses, locale),
    },
    {
      header: 'Lucro Líquido',
      align: 'right',
      sortKey: 'profit',
      accessor: (r) => (
        <span className={r.accumulated_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.accumulated_profit, locale)}
        </span>
      ),
    },
    {
      header: 'Lucro c/ Depreciação',
      align: 'right',
      sortKey: 'depreciated_profit',
      accessor: (r) => formatCurrency(r.accumulated_depreciated_profit, locale),
    },
    {
      header: 'Valor de Mercado Atual',
      align: 'right',
      sortKey: 'market_value',
      accessor: (r) => (r.current_market_value ? formatCurrency(r.current_market_value, locale) : '—'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(r) => r.vehicle_id}
      emptyMessage="Nenhum veículo encontrado para este investidor"
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
