'use client';

import { DataTable, type Column } from '@/components/ui/data-table';
import { formatPercentage } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';

export interface ParticipationRow {
  id: string;
  investor_id: string;
  ownership_percentage: number;
  administration_fee_percentage: number;
  investors: { full_name: string } | null;
}

// CR-010 (v1.3): sortable grid.
export function ParticipationsTable({
  participations,
  locale,
}: {
  participations: ParticipationRow[];
  locale: 'pt' | 'en';
}) {
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: ParticipationRow, column: string) => {
    switch (column) {
      case 'investor':
        return row.investors?.full_name;
      case 'ownership':
        return row.ownership_percentage;
      case 'fee':
        return row.administration_fee_percentage;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(participations, sort, getValue);

  const columns: Column<ParticipationRow>[] = [
    { header: 'Investidor', sortKey: 'investor', accessor: (p) => p.investors?.full_name ?? '—' },
    {
      header: 'Propriedade',
      align: 'right',
      sortKey: 'ownership',
      accessor: (p) => formatPercentage(p.ownership_percentage, locale),
    },
    {
      header: 'Taxa Adm.',
      align: 'right',
      sortKey: 'fee',
      accessor: (p) => formatPercentage(p.administration_fee_percentage, locale),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(p) => p.id}
      emptyMessage="Nenhuma participação cadastrada"
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
