'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

export interface InvestorRow {
  id: string;
  full_name: string;
  document_number: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  lookup_document_types: { label: string } | null;
}

export function InvestorsTable({ investors, emptyMessage }: { investors: InvestorRow[]; emptyMessage: string }) {
  const router = useRouter();

  const columns: Column<InvestorRow>[] = [
    { header: 'Nome', accessor: (i) => <span className="font-medium">{i.full_name}</span> },
    {
      header: 'Documento',
      accessor: (i) => `${i.lookup_document_types?.label ?? '—'}: ${i.document_number}`,
    },
    { header: 'E-mail', accessor: (i) => i.email ?? '—' },
    { header: 'Telefone', accessor: (i) => i.phone ?? '—' },
    {
      header: 'Status',
      align: 'center',
      accessor: (i) => (
        <Badge variant={i.is_active ? 'success' : 'default'}>{i.is_active ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={investors}
      keyExtractor={(i) => i.id}
      emptyMessage={emptyMessage}
      onRowClick={(i) => router.push(`/investors/${i.id}/edit`)}
    />
  );
}
