import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { RevenueForm } from '@/components/forms/revenue-form';
import type { Vehicle, Driver, Revenue } from '@/types/database';

export default async function EditRevenuePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: revenue }, { data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('revenues').select('*').eq('id', params.id).single<Revenue>(),
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
    supabase.from('drivers').select('*').order('full_name').returns<Driver[]>(),
  ]);

  if (!revenue) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('edit')}</h1>
      <RevenueForm vehicles={vehicles ?? []} drivers={drivers ?? []} revenue={revenue} />
    </div>
  );
}
