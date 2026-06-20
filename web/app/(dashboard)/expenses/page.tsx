import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ExpensesTable, type ExpenseRow } from '@/components/tables/expenses-table';
import { Button } from '@/components/ui/button';

export default async function ExpensesPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, expense_date, amount, notes, vehicles(plate_number), lookup_expense_types(label)')
    .order('expense_date', { ascending: false })
    .limit(100)
    .returns<ExpenseRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('expenses')}</h1>
        <Link href="/expenses/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <ExpensesTable expenses={expenses ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
