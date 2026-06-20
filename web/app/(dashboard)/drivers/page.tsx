import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { DriversTable, type DriverRow } from '@/components/tables/drivers-table';
import { Button } from '@/components/ui/button';

export default async function DriversPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, full_name, phone, email, start_date, lookup_driver_statuses(code, label)')
    .order('full_name')
    .returns<DriverRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('drivers')}</h1>
        <Link href="/drivers/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <DriversTable drivers={drivers ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
