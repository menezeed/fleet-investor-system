import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { RevenueForm } from '@/components/forms/revenue-form';
import type { Vehicle, Driver } from '@/types/database';

export default async function NewRevenuePage() {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
    supabase.from('drivers').select('*').order('full_name').returns<Driver[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <RevenueForm vehicles={vehicles ?? []} drivers={drivers ?? []} />
    </div>
  );
}
