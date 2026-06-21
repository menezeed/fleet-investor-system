import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { VehiclesTable, type VehicleRow } from '@/components/tables/vehicles-table';
import { Button } from '@/components/ui/button';

export default async function VehiclesPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select(
      'id, plate_number, brand, model, model_year, acquisition_value, current_market_value, lookup_vehicle_statuses(code, label)'
    )
    .order('created_at', { ascending: false })
    .returns<VehicleRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('vehicles')}</h1>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <VehiclesTable vehicles={vehicles ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
