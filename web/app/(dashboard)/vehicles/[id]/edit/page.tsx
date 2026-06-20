import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleForm } from '@/components/forms/vehicle-form';
import type { Vehicle } from '@/types/database';

export default async function EditVehiclePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const t = await getTranslations('common');

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single<Vehicle>();

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {t('edit')} — {vehicle.plate_number}
      </h1>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
