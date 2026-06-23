'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EventsTable, type EventRow } from '@/components/tables/events-table';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Select } from '@/components/ui/form-fields';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { useSortableState } from '@/lib/utils/use-sortable';
import type { Vehicle } from '@/types/database';

// CR-004/CR-010: a date-range-filterable list of events (completed and
// planned) is shown before the creation form/button, with vehicle and status
// filters, sorted by date. Defaults: "De" = first day of current month,
// "Até" = today (UAT fix — previously "Até" had no default).
export default function EventsPage() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'completed' | 'planned'>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { sort, toggleSort } = useSortableState({ column: 'planned_date', direction: 'asc' });

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*')
      .order('plate_number')
      .returns<Vehicle[]>()
      .then(({ data }) => setVehicles(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let query = supabase
        .from('vehicle_events')
        .select(
          'id, planned_date, value, mileage, is_completed, vehicles(plate_number), lookup_expense_types(label)'
        )
        // CR-010: clicking a column header re-sorts; default is date ascending.
        .order(sort.column ?? 'planned_date', { ascending: sort.direction === 'asc', nullsFirst: false });

      if (startDate) query = query.gte('planned_date', startDate);
      if (endDate) query = query.lte('planned_date', endDate);
      if (vehicleFilter) query = query.eq('vehicle_id', vehicleFilter);
      if (statusFilter === 'completed') query = query.eq('is_completed', true);
      if (statusFilter === 'planned') query = query.eq('is_completed', false);

      const { data } = await query.returns<EventRow[]>();
      setEvents(data ?? []);
      setLoading(false);
    }

    load();
  }, [startDate, endDate, vehicleFilter, statusFilter, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Eventos</h1>
        {/* CR-004 Change 3 */}
        <Link href="/events/new">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <FieldWrapper label="De" error={undefined}>
          <DatePickerBr name="start_date" value={startDate} onChange={setStartDate} />
        </FieldWrapper>
        <FieldWrapper label="Até" error={undefined}>
          <DatePickerBr name="end_date" value={endDate} onChange={setEndDate} />
        </FieldWrapper>
        {/* UAT fix: vehicle filter next to the period selector */}
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
        {/* UAT fix: status filter next to the period selector */}
        <FieldWrapper label="Status" error={undefined} className="w-40">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="">Todos</option>
            <option value="planned">Planejado</option>
            <option value="completed">Concluído</option>
          </Select>
        </FieldWrapper>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <EventsTable
          events={events}
          emptyMessage="Nenhum evento encontrado no período selecionado"
          sort={sort}
          onSortChange={toggleSort}
        />
      )}
    </div>
  );
}
