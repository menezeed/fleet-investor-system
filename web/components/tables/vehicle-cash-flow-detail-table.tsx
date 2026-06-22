'use client';

import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { VehicleCashFlowDetail } from '@/types/database';

// CR-014: Vehicle Detail — every financial movement since acquisition.
export function VehicleCashFlowDetailTable({ rows }: { rows: VehicleCashFlowDetail[] }) {
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<VehicleCashFlowDetail>[] = [
    { header: 'Data', accessor: (r) => formatDate(r.transaction_date, locale) },
    { header: 'Tipo', accessor: (r) => (r.transaction_type === 'revenue' ? 'Receita' : 'Despesa') },
    { header: 'Categoria', accessor: (r) => r.category_label },
    {
      header: 'Valor',
      align: 'right',
      accessor: (r) => (
        <span className={r.transaction_type === 'expense' ? 'text-destructive font-medium' : 'text-success font-medium'}>
          {r.transaction_type === 'expense' ? '-' : ''}
          {formatCurrency(r.amount, locale)}
        </span>
      ),
    },
    {
      header: 'Quilometragem',
      align: 'right',
      accessor: (r) => (r.mileage != null ? new Intl.NumberFormat('pt-BR').format(r.mileage) : '—'),
    },
    { header: 'Observações', accessor: (r) => r.notes ?? '—' },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(r) => r.id}
      emptyMessage="Nenhuma movimentação registrada para este veículo"
    />
  );
}
