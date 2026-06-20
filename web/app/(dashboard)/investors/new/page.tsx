import { getTranslations } from 'next-intl/server';
import { InvestorForm } from '@/components/forms/investor-form';

export default async function NewInvestorPage() {
  const t = await getTranslations('common');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <InvestorForm />
    </div>
  );
}
