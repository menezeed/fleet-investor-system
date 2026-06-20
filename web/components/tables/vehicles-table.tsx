'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge, statusToVariant } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';

export interface VehicleRow {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  model_year: number;
  acquisition_cost: number;
  current_market_value: number | null;
  lookup_vehicle_statuses: { code: string; label: string } | null;
}

export function VehiclesTable({ vehicles, emptyMessage }: { vehicles: VehicleRow[]; emptyMessage: string }) {
  const router = useRouter();
  const locale = useLocale() as 'pt' | 'en';

  const columns: Column<VehicleRow>[] = [
    { header: 'Placa', accessor: (v) => <span className="font-medium">{v.plate_number}</span> },
    { header: 'Marca/Modelo', accessor: (v) => `${v.brand} ${v.model}` },
    { header: 'Ano', accessor: (v) => v.model_year, align: 'center' },
    {
      header: 'Custo Aquisição',
      align: 'right',
      accessor: (v) => formatCurrency(v.acquisition_cost, locale),
    },
    {
      header: 'Valor Atual',
      align: 'right',
      accessor: (v) => (v.current_market_value ? formatCurrency(v.current_market_value, locale) : '—'),
    },
    {
      header: 'Status',
      align: 'center',
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
      rows={vehicles}
      keyExtractor={(v) => v.id}
      emptyMessage={emptyMessage}
      onRowClick={(v) => router.push(`/vehicles/${v.id}`)}
    />
  );
}
