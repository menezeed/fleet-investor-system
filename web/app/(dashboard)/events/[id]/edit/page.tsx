import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleEventForm } from '@/components/forms/vehicle-event-form';
import type { Vehicle, VehicleEvent } from '@/types/database';

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const [{ data: event }, { data: vehicles }] = await Promise.all([
    supabase.from('vehicle_events').select('*').eq('id', params.id).single<VehicleEvent>(),
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>(),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('edit')}</h1>
      <VehicleEventForm vehicles={vehicles ?? []} event={event} />
    </div>
  );
}
