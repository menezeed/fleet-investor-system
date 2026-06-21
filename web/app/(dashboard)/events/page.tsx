'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EventsTable, type EventRow } from '@/components/tables/events-table';
import { Button } from '@/components/ui/button';
import { FieldWrapper } from '@/components/ui/form-fields';
import { DateInputBr } from '@/components/ui/date-input-br';

// CR-004 Change 2: a date-range-filterable list of events (completed and
// planned) is shown before the creation form/button, not after.
export default function EventsPage() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let query = supabase
        .from('vehicle_events')
        .select(
          'id, planned_date, value, mileage, is_completed, vehicles(plate_number), lookup_expense_types(label)'
        )
        .order('planned_date', { ascending: false, nullsFirst: false });

      if (startDate) query = query.gte('planned_date', startDate);
      if (endDate) query = query.lte('planned_date', endDate);

      const { data } = await query.returns<EventRow[]>();
      setEvents(data ?? []);
      setLoading(false);
    }

    load();
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <DateInputBr name="start_date" value={startDate} onChange={setStartDate} />
        </FieldWrapper>
        <FieldWrapper label="Até" error={undefined}>
          <DateInputBr name="end_date" value={endDate} onChange={setEndDate} />
        </FieldWrapper>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <EventsTable events={events} emptyMessage="Nenhum evento encontrado no período selecionado" />
      )}
    </div>
  );
}
