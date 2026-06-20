'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { FieldWrapper, Input, Select } from '@/components/ui/form-fields';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface EventReportRow {
  id: string;
  description: string;
  planned_date: string | null;
  value: number | null;
  plate_number: string;
}

export default function EventsReportPage() {
  const supabase = createClient();
  const locale = 'pt' as const;

  const today = new Date().toISOString().slice(0, 10);
  const [timeframe, setTimeframe] = useState<'past' | 'future'>('future');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<EventReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let query = supabase
        .from('vehicle_events')
        .select('id, description, planned_date, value, vehicles(plate_number)')
        .not('planned_date', 'is', null);

      if (timeframe === 'future') {
        query = query.gte('planned_date', startDate || today);
      } else {
        query = query.lte('planned_date', endDate || today);
      }

      if (startDate && timeframe === 'past') query = query.gte('planned_date', startDate);
      if (endDate && timeframe === 'future') query = query.lte('planned_date', endDate);

      const { data } = await query.order('planned_date', { ascending: timeframe === 'future' });

      setRows(
        // `any` here: same nested-join inference note as in reports/investors/page.tsx
        (data ?? []).map((r: any) => ({
          id: r.id,
          description: r.description,
          planned_date: r.planned_date,
          value: r.value,
          plate_number: r.vehicles?.plate_number ?? '—',
        }))
      );
      setLoading(false);
    }

    load();
  }, [timeframe, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns: Column<EventReportRow>[] = [
    { header: 'Veículo', accessor: (e) => e.plate_number },
    { header: 'Descrição', accessor: (e) => e.description },
    { header: 'Data', accessor: (e) => (e.planned_date ? formatDate(e.planned_date, locale) : '—') },
    { header: 'Valor', align: 'right', accessor: (e) => (e.value ? formatCurrency(e.value, locale) : '—') },
  ];

  const exportRows = rows.map((e) => ({
    vehicle: e.plate_number,
    description: e.description,
    date: e.planned_date,
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
            { header: 'Veículo', key: 'vehicle' },
            { header: 'Descrição', key: 'description' },
            { header: 'Data', key: 'date', type: 'date' },
            { header: 'Valor', key: 'value', type: 'currency' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <FieldWrapper label="Período" error={undefined} className="w-40">
          <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value as 'past' | 'future')}>
            <option value="future">Eventos Futuros</option>
            <option value="past">Eventos Passados</option>
          </Select>
        </FieldWrapper>
        <FieldWrapper label="De" error={undefined}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="Até" error={undefined}>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
