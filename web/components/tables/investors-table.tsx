'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';

export interface InvestorRow {
  id: string;
  full_name: string;
  document_number: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  lookup_document_types: { label: string } | null;
}

// CR-010 (v1.3): sortable grid.
export function InvestorsTable({ investors, emptyMessage }: { investors: InvestorRow[]; emptyMessage: string }) {
  const router = useRouter();
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: InvestorRow, column: string) => {
    switch (column) {
      case 'name':
        return row.full_name;
      case 'document':
        return row.document_number;
      case 'email':
        return row.email;
      case 'phone':
        return row.phone;
      case 'status':
        return row.is_active ? 1 : 0;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(investors, sort, getValue);

  const columns: Column<InvestorRow>[] = [
    { header: 'Nome', sortKey: 'name', accessor: (i) => <span className="font-medium">{i.full_name}</span> },
    {
      header: 'Documento',
      sortKey: 'document',
      accessor: (i) => `${i.lookup_document_types?.label ?? '—'}: ${i.document_number}`,
    },
    { header: 'E-mail', sortKey: 'email', accessor: (i) => i.email ?? '—' },
    { header: 'Telefone', sortKey: 'phone', accessor: (i) => i.phone ?? '—' },
    {
      header: 'Status',
      align: 'center',
      sortKey: 'status',
      accessor: (i) => (
        <Badge variant={i.is_active ? 'success' : 'default'}>{i.is_active ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(i) => i.id}
      emptyMessage={emptyMessage}
      onRowClick={(i) => router.push(`/investors/${i.id}/edit`)}
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
