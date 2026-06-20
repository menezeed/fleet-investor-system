'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

export interface InvestorReportRow {
  investor_id: string;
  investor_name: string;
  vehicle_plate: string;
  ownership_percentage: number;
  administration_fee_percentage: number;
  investor_accumulated_profit: number;
  investor_accumulated_depreciated_profit: number;
  investor_portfolio_value_share: number;
}

export function InvestorReportTable({
  rows,
  locale,
}: {
  rows: InvestorReportRow[];
  locale: 'pt' | 'en';
}) {
  const columns: Column<InvestorReportRow>[] = [
    { header: 'Investidor', accessor: (r) => <span className="font-medium">{r.investor_name}</span> },
    { header: 'Veículo', accessor: (r) => r.vehicle_plate },
    {
      header: 'Propriedade',
      align: 'right',
      accessor: (r) => formatPercentage(r.ownership_percentage, locale),
    },
    {
      header: 'Taxa Adm.',
      align: 'right',
      accessor: (r) => formatPercentage(r.administration_fee_percentage, locale),
    },
    {
      header: 'Lucro do Investidor',
      align: 'right',
      accessor: (r) => (
        <span
          className={
            r.investor_accumulated_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'
          }
        >
          {formatCurrency(r.investor_accumulated_profit, locale)}
        </span>
      ),
    },
    {
      header: 'Lucro c/ Depreciação',
      align: 'right',
      accessor: (r) => formatCurrency(r.investor_accumulated_depreciated_profit, locale),
    },
    {
      header: 'Valor do Portfólio',
      align: 'right',
      accessor: (r) => formatCurrency(r.investor_portfolio_value_share, locale),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(r) => `${r.investor_id}-${r.vehicle_plate}`}
      emptyMessage="Nenhuma participação cadastrada"
    />
  );
}
