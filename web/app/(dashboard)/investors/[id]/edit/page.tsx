import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { InvestorForm } from '@/components/forms/investor-form';
import type { Investor } from '@/types/database';

export default async function EditInvestorPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const { data: investor } = await supabase
    .from('investors')
    .select('*')
    .eq('id', params.id)
    .single<Investor>();

  if (!investor) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {t('edit')} — {investor.full_name}
      </h1>
      <InvestorForm investor={investor} />
    </div>
  );
}
