'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { formatPercentage } from '@/lib/utils/format';

export interface ParticipationRow {
  id: string;
  investor_id: string;
  ownership_percentage: number;
  administration_fee_percentage: number;
  investors: { full_name: string } | null;
}

export function ParticipationsTable({
  participations,
  locale,
}: {
  participations: ParticipationRow[];
  locale: 'pt' | 'en';
}) {
  const columns: Column<ParticipationRow>[] = [
    { header: 'Investidor', accessor: (p) => p.investors?.full_name ?? '—' },
    {
      header: 'Propriedade',
      align: 'right',
      accessor: (p) => formatPercentage(p.ownership_percentage, locale),
    },
    {
      header: 'Taxa Adm.',
      align: 'right',
      accessor: (p) => formatPercentage(p.administration_fee_percentage, locale),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={participations}
      keyExtractor={(p) => p.id}
      emptyMessage="Nenhuma participação cadastrada"
    />
  );
}
