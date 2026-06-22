import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleAssignmentForm } from '@/components/forms/vehicle-assignment-form';
import type { Vehicle, Driver } from '@/types/database';

export default async function NewAssignmentPage() {
  const supabase = createClient();
  const t = await getTranslations('common');

  // CR-009 bug fix: these queries used to filter on `status`/a literal string
  // ('sold', 'active'), which no longer exists as a column — both vehicles
  // and drivers now reference status via status_id (a UUID FK to a lookup
  // table). The old filters silently matched nothing, leaving both dropdowns
  // empty even though vehicles/drivers existed. Filtering by joined
  // lookup_*.code restores the intended behavior without hardcoding UUIDs.
  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, lookup_vehicle_statuses!inner(code)')
      .neq('lookup_vehicle_statuses.code', 'sold')
      .order('plate_number')
      .returns<Vehicle[]>(),
    supabase
      .from('drivers')
      .select('*, lookup_driver_statuses!inner(code)')
      .eq('lookup_driver_statuses.code', 'active')
      .order('full_name')
      .returns<Driver[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('create')}</h1>
      <VehicleAssignmentForm vehicles={vehicles ?? []} drivers={drivers ?? []} />
    </div>
  );
}
