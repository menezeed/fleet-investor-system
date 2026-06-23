'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';

export interface VehicleRow {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  model_year: number;
  acquisition_value: number;
  current_market_value: number | null;
  lookup_vehicle_statuses: { code: string; label: string } | null;
}

// CR-010 (v1.3): sortable grid.
export function VehiclesTable({ vehicles, emptyMessage }: { vehicles: VehicleRow[]; emptyMessage: string }) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';
  const { sort, toggleSort } = useSortableState();

  const getValue = (row: VehicleRow, column: string) => {
    switch (column) {
      case 'plate':
        return row.plate_number;
      case 'name':
        return `${row.brand} ${row.model}`;
      case 'year':
        return row.model_year;
      case 'acquisition':
        return row.acquisition_value;
      case 'market':
        return row.current_market_value;
      case 'status':
        return row.lookup_vehicle_statuses?.label;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(vehicles, sort, getValue);

  const columns: Column<VehicleRow>[] = [
    { header: 'Placa', sortKey: 'plate', accessor: (v) => <span className="font-medium">{v.plate_number}</span> },
    { header: 'Marca/Modelo', sortKey: 'name', accessor: (v) => `${v.brand} ${v.model}` },
    { header: 'Ano', sortKey: 'year', accessor: (v) => v.model_year, align: 'center' },
    {
      header: 'Valor de Aquisição',
      align: 'right',
      sortKey: 'acquisition',
      accessor: (v) => formatCurrency(v.acquisition_value, locale),
    },
    {
      header: 'Valor Atual',
      align: 'right',
      sortKey: 'market',
      accessor: (v) => (v.current_market_value ? formatCurrency(v.current_market_value, locale) : '—'),
    },
    {
      header: 'Status',
      align: 'center',
      sortKey: 'status',
      accessor: (v) => (
        <Badge variant={statusToVariant(v.lookup_vehicle_statuses?.code ?? '')}>
          {v.lookup_vehicle_statuses?.label ?? '—'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      keyExtractor={(v) => v.id}
      emptyMessage={emptyMessage}
      onRowClick={(v) => router.push(`/vehicles/${v.id}`)}
      sort={sort}
      onSortChange={toggleSort}
    />
  );
}
