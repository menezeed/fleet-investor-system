import { createClient } from '@/lib/supabase/server';
import { EventCatalogManager } from '@/components/lookups/event-catalog-manager';
import type { EventCatalogItem } from '@/types/database';

export default async function EventCatalogPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from('lookup_expense_types')
    .select('*')
    .order('sort_order')
    .returns<EventCatalogItem[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Catálogo de Eventos</h1>
      <EventCatalogManager initialItems={items ?? []} />
    </div>
  );
}
