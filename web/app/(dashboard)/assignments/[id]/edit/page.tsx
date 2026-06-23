import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleAssignmentForm } from '@/components/forms/vehicle-assignment-form';
import type { Vehicle, Driver, VehicleAssignment } from '@/types/database';

export default async function EditAssignmentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: entry }, { data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicle_assignments').select('*').eq('id', params.id).single<VehicleAssignment>(),
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
    supabase.from('drivers').select('*').order('full_name').returns<Driver[]>(),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('edit')}</h1>
      <VehicleAssignmentForm vehicles={vehicles ?? []} drivers={drivers ?? []} entry={entry} />
    </div>
  );
}
