import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ExpenseForm } from '@/components/forms/expense-form';
import type { Vehicle, Expense } from '@/types/database';

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: expense }, { data: vehicles }] = await Promise.all([
    supabase.from('expenses').select('*').eq('id', params.id).single<Expense>(),
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('edit')}</h1>
      <ExpenseForm vehicles={vehicles ?? []} expense={expense} />
    </div>
  );
}
