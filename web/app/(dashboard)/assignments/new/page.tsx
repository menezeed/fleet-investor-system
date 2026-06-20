import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleAssignmentForm } from '@/components/forms/vehicle-assignment-form';
import type { Vehicle, Driver } from '@/types/database';

export default async function NewAssignmentPage() {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicles').select('*').neq('status', 'sold').order('plate_number').returns<Vehicle[]>(),
    supabase.from('drivers').select('*').eq('status', 'active').order('full_name').returns<Driver[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <VehicleAssignmentForm vehicles={vehicles ?? []} drivers={drivers ?? []} />
    </div>
  );
}
