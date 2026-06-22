'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { FieldWrapper, Select } from '@/components/ui/form-fields';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Vehicle, Investor } from '@/types/database';

interface EventReportRow {
  id: string;
  description: string | null;
  planned_date: string | null;
  value: number | null;
  plate_number: string;
  vehicle_name: string;
}

// CR-014: Events Report — adds Investor and Vehicle filters; columns in
// order Date, Vehicle Name / License Plate, Event Description, Amount;
// sorted by date.
export default function EventsReportPage() {
  const supabase = createClient();
  const locale = 'pt' as const;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [investorFilter, setInvestorFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rows, setRows] = useState<EventReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('investors').select('*').eq('is_active', true).order('full_name').returns<Investor[]>().then(({ data }) => setInvestors(data ?? []));
    supabase.from('vehicles').select('*').order('plate_number').returns<Vehicle[]>().then(({ data }) => setVehicles(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // CR-014: Investor filter scopes to vehicles owned by that investor.
      let vehicleIdsForInvestor: string[] | null = null;
      if (investorFilter) {
        const { data: participations } = await supabase
          .from('investor_participations')
          .select('vehicle_id')
          .eq('investor_id', investorFilter)
          .is('end_date', null);
        vehicleIdsForInvestor = (participations ?? []).map((p) => p.vehicle_id);
      }

      let query = supabase
        .from('vehicle_events')
        .select('id, description, planned_date, value, vehicles(plate_number, brand, model)');

      if (startDate) query = query.gte('planned_date', startDate);
      if (endDate) query = query.lte('planned_date', endDate);
      if (vehicleFilter) query = query.eq('vehicle_id', vehicleFilter);
      if (vehicleIdsForInvestor) query = query.in('vehicle_id', vehicleIdsForInvestor.length > 0 ? vehicleIdsForInvestor : ['00000000-0000-0000-0000-000000000000']);

      // CR-014: sorted by date
      const { data } = await query.order('planned_date', { ascending: true, nullsFirst: false });

      // `any` here: nested join shape without a generated Supabase type.
      setRows(
        (data ?? []).map((r: any) => ({
          id: r.id,
          description: r.description,
          planned_date: r.planned_date,
          value: r.value,
          plate_number: r.vehicles?.plate_number ?? '—',
          vehicle_name: r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : '—',
        }))
      );
      setLoading(false);
    }

    load();
  }, [startDate, endDate, investorFilter, vehicleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // CR-014: column order = Date, Vehicle Name / License Plate, Event Description, Amount
  const columns: Column<EventReportRow>[] = [
    { header: 'Data', accessor: (e) => (e.planned_date ? formatDate(e.planned_date, locale) : '—') },
    { header: 'Veículo / Placa', accessor: (e) => `${e.vehicle_name} — ${e.plate_number}` },
    { header: 'Descrição do Evento', accessor: (e) => e.description ?? '—' },
    { header: 'Valor', align: 'right', accessor: (e) => (e.value ? formatCurrency(e.value, locale) : '—') },
  ];

  const exportRows = rows.map((e) => ({
    date: e.planned_date,
    vehicle: `${e.vehicle_name} — ${e.plate_number}`,
    description: e.description ?? '',
    value: e.value,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Relatório de Eventos</h1>
        <ExportButtons
          title="Relatorio de Eventos"
          rows={exportRows}
          columns={[
            { header: 'Data', key: 'date', type: 'date' },
            { header: 'Veículo / Placa', key: 'vehicle' },
            { header: 'Descrição do Evento', key: 'description' },
            { header: 'Valor', key: 'value', type: 'currency' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <FieldWrapper label="De" error={undefined}>
          <DatePickerBr name="start_date" value={startDate} onChange={setStartDate} />
        </FieldWrapper>
        <FieldWrapper label="Até" error={undefined}>
          <DatePickerBr name="end_date" value={endDate} onChange={setEndDate} />
        </FieldWrapper>
        {/* CR-014: Investor filter */}
        <FieldWrapper label="Investidor" error={undefined} className="w-56">
          <Select value={investorFilter} onChange={(e) => setInvestorFilter(e.target.value)}>
            <option value="">Todos os Investidores</option>
            {investors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        {/* CR-014: Vehicle filter */}
        <FieldWrapper label="Veículo" error={undefined} className="w-56">
          <Select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
            <option value="">Todos os Veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} — {v.brand} {v.model}
              </option>
            ))}
          </Select>
        </FieldWrapper>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyExtractor={(e) => e.id} emptyMessage="Nenhum evento encontrado" />
      )}
    </div>
  );
}
