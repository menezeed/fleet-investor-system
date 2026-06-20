import { getTranslations } from 'next-intl/server';
import { DriverForm } from '@/components/forms/driver-form';

export default async function NewDriverPage() {
  const t = await getTranslations('common');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <DriverForm />
    </div>
  );
}
