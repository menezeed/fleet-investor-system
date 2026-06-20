import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { InvestorsTable, type InvestorRow } from '@/components/tables/investors-table';
import { Button } from '@/components/ui/button';

export default async function InvestorsPage() {
  const supabase = createClient();
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const { data: investors } = await supabase
    .from('investors')
    .select('id, full_name, document_number, email, phone, is_active, lookup_document_types(label)')
    .order('full_name')
    .returns<InvestorRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('investors')}</h1>
        <Link href="/investors/new">
          <Button>
            <Plus className="h-4 w-4" />
            {tCommon('create')}
          </Button>
        </Link>
      </div>

      <InvestorsTable investors={investors ?? []} emptyMessage={tCommon('noResults')} />
    </div>
  );
}
