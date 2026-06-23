'use client';

import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';
import type { VehicleCashFlowDetail } from '@/types/database';

// CR-014: Vehicle Detail — every financial movement since acquisition.
// CR-006/010 (v1.3): sortable, default Date ascending then Transaction Type.
export function VehicleCashFlowDetailTable({ rows }: { rows: VehicleCashFlowDetail[] }) {
  const locale = useLocale() as 'pt' | 'en';
  const { sort, toggleSort } = useSortableState({ column: 'transaction_date', direction: 'asc' });

  const getValue = (row: VehicleCashFlowDetail, column: string) => {
    switch (column) {
      case 'transaction_date':
        return row.transaction_date;
      case 'transaction_type':
        return row.transaction_type;
      case 'category':
        return row.category_label;
      case 'amount':
        return row.amount;
      case 'mileage':
        return row.mileage;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(rows, sort, getValue);

  const columns: Column<VehicleCashFlowDetail>[] = [
    { header: 'Data', sortKey: 'transaction_date', accessor: (r) => formatDate(r.transaction_date, locale) },
    {
      header: 'Tipo',
      sortKey: 'transaction_type',
      accessor: (r) => (r.transaction_type === 'revenue' ? 'Receita' : 'Despesa'),
    },
    { header: 'Categoria', sortKey: 'category', accessor: (r) => r.category_label },
    {
      header: 'Valor',
      align: 'right',
      sortKey: 'amount',
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
      sortKey: 'mileage',
      accessor: (r) => (r.mileage != null ? new Intl.NumberFormat('pt-BR').format(r.mileage) : '—'),
    },
    { header: 'Observações', accessor: (r) => r.notes ?? '—' },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(r) => r.id}
      emptyMessage="Nenhuma movimentação registrada para este veículo"
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
