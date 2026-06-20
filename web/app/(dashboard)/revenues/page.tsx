import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { RevenuesTable, type RevenueRow } from '@/components/tables/revenues-table';
import { Button } from '@/components/ui/button';

export default async function RevenuesPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: revenues } = await supabase
    .from('revenues')
    .select(
      'id, revenue_date, amount, notes, vehicles(plate_number), drivers(full_name), lookup_revenue_types(label)'
    )
    .order('revenue_date', { ascending: false })
    .limit(100)
    .returns<RevenueRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('revenues')}</h1>
        <Link href="/revenues/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <RevenuesTable revenues={revenues ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
