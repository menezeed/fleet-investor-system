'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export interface ExpenseRow {
  id: string;
  expense_date: string;
  amount: number;
  notes: string | null;
  vehicles: { plate_number: string } | null;
  lookup_expense_types: { label: string } | null;
}

export function ExpensesTable({ expenses, emptyMessage }: { expenses: ExpenseRow[]; emptyMessage: string }) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<ExpenseRow>[] = [
    { header: 'Data', accessor: (e) => formatDate(e.expense_date, locale) },
    { header: 'Veículo', accessor: (e) => e.vehicles?.plate_number ?? '—' },
    { header: 'Tipo', accessor: (e) => e.lookup_expense_types?.label ?? '—' },
    {
      header: 'Valor',
      align: 'right',
      accessor: (e) => <span className="text-destructive font-medium">{formatCurrency(e.amount, locale)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={expenses}
      keyExtractor={(e) => e.id}
      emptyMessage={emptyMessage}
      onRowClick={(e) => router.push(`/expenses/${e.id}/edit`)}
    />
  );
}
