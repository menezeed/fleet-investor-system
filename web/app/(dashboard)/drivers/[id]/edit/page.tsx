import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { DriverForm } from '@/components/forms/driver-form';
import type { Driver } from '@/types/database';

export default async function EditDriverPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const { data: driver } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', params.id)
    .single<Driver>();

  if (!driver) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {t('edit')} — {driver.full_name}
      </h1>
      <DriverForm driver={driver} />
    </div>
  );
}
