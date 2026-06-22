import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CashFlowForm } from '@/components/forms/cash-flow-form';
import type { Vehicle, CashFlow } from '@/types/database';

export default async function EditCashFlowPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: entry }, { data: vehicles }] = await Promise.all([
    supabase.from('cash_flow').select('*').eq('id', params.id).single<CashFlow>(),
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('edit')}</h1>
      <CashFlowForm vehicles={vehicles ?? []} entry={entry} />
    </div>
  );
}
