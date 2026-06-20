import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LookupManager } from '@/components/lookups/lookup-manager';
import { getLookupConfig, LOOKUP_CONFIGS } from '@/lib/lookups/config';
import type { LookupItem } from '@/types/database';

export function generateStaticParams() {
  return LOOKUP_CONFIGS.map((c) => ({ slug: c.slug }));
}

export default async function LookupDetailPage({ params }: { params: { slug: string } }) {
  const config = getLookupConfig(params.slug);
  if (!config) {
    notFound();
  }

  const supabase = createClient();
  const { data: items } = await supabase
    .from(config.table)
    .select('*')
    .order('sort_order')
    .returns<LookupItem[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{config.title}</h1>
      <LookupManager config={config} initialItems={items ?? []} />
    </div>
  );
}
