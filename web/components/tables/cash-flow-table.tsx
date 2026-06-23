'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { SortState } from '@/lib/utils/use-sortable';

export interface CashFlowRow {
  id: string;
  transaction_date: string;
  transaction_type: 'revenue' | 'expense';
  amount: number;
  vehicles: { plate_number: string; brand: string; model: string } | null;
  category_label: string | null;
}

// CR-011: Grid columns = Date, Vehicle Name, License Plate, Transaction
// Type, Amount. Expenses displayed in red. CR-006/010 (v1.3): sortable,
// default Date ascending then Transaction Type.
export function CashFlowTable({
  rows,
  emptyMessage,
  sort,
  onSortChange,
}: {
  rows: CashFlowRow[];
  emptyMessage: string;
  sort: SortState;
  onSortChange: (column: string) => void;
}) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<CashFlowRow>[] = [
    { header: 'Data', sortKey: 'transaction_date', accessor: (r) => formatDate(r.transaction_date, locale) },
    {
      header: 'Veículo',
      accessor: (r) => (r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : '—'),
    },
    { header: 'Placa', accessor: (r) => r.vehicles?.plate_number ?? '—' },
    { header: 'Categoria', accessor: (r) => r.category_label ?? '—' },
    {
      header: 'Tipo',
      align: 'center',
      sortKey: 'transaction_type',
      accessor: (r) => (r.transaction_type === 'revenue' ? 'Receita' : 'Despesa'),
    },
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
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyExtractor={(r) => r.id}
      emptyMessage={emptyMessage}
      onRowClick={(r) => router.push(`/cash-flow/${r.id}/edit`)}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
