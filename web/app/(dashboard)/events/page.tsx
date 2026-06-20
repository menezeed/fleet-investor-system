import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EventsTable, type EventRow } from '@/components/tables/events-table';
import { Button } from '@/components/ui/button';

export default async function EventsPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: events } = await supabase
    .from('vehicle_events')
    .select('id, description, planned_date, value, is_completed, vehicles(plate_number)')
    .order('planned_date', { ascending: true, nullsFirst: false })
    .returns<EventRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('events')}</h1>
        <Link href="/events/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <EventsTable events={events ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
