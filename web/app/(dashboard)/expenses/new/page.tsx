import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ExpenseForm } from '@/components/forms/expense-form';
import type { Vehicle } from '@/types/database';

export default async function NewExpensePage() {
  const supabase = createClient();
  const t = await getTranslations('common');

  const { data: vehicles } = await supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <ExpenseForm vehicles={vehicles ?? []} />
    </div>
  );
}
