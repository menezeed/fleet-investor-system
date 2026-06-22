'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CashFlowTable, type CashFlowRow } from '@/components/tables/cash-flow-table';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Select } from '@/components/ui/form-fields';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import type { Vehicle } from '@/types/database';

// CR-011: Cash Flow List. Filters: Date Range (default: first day of
// current month to today), Vehicle (default: all), Transaction Type
// (Revenue/Expense/All). Grid shows Date, Vehicle Name, License Plate,
// Transaction Type, Amount (expenses in red). Create button opens the
// creation screen; clicking a row opens its edit screen.
export default function CashFlowPage() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'revenue' | 'expense'>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rows, setRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);

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
        .from('vehicle_cash_flow_detail')
        .select('id, transaction_date, transaction_type, amount, category_label, vehicle_id')
        .order('transaction_date', { ascending: false });

      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);
      if (vehicleFilter) query = query.eq('vehicle_id', vehicleFilter);
      if (typeFilter) query = query.eq('transaction_type', typeFilter);

      const { data } = await query;

      // `any` here: vehicle_cash_flow_detail has no generated Supabase type
      // (same pattern as reports/investors and reports/events). Resolve
      // vehicle plate/brand/model client-side from the already-loaded
      // vehicles list, avoiding an extra join shape on the view.
      const enriched: CashFlowRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        transaction_date: r.transaction_date,
        transaction_type: r.transaction_type,
        amount: r.amount,
        category_label: r.category_label,
        vehicles: vehicles.find((v) => v.id === r.vehicle_id) ?? null,
      }));

      setRows(enriched);
      setLoading(false);
    }

    if (vehicles.length > 0 || vehicleFilter === '') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, vehicleFilter, typeFilter, vehicles]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Fluxo de Caixa</h1>
        <Link href="/cash-flow/new">
          <Button>
            <Plus className="h-4 w-4" />
            Criar
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
        <FieldWrapper label="Tipo" error={undefined} className="w-40">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
            <option value="">Todos</option>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </Select>
        </FieldWrapper>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <CashFlowTable rows={rows} emptyMessage="Nenhuma transação encontrada no período selecionado" />
      )}
    </div>
  );
}
