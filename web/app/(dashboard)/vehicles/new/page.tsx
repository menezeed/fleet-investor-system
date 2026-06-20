import { getTranslations } from 'next-intl/server';
import { VehicleForm } from '@/components/forms/vehicle-form';

export default async function NewVehiclePage() {
  const t = await getTranslations('common');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <VehicleForm />
    </div>
  );
}
