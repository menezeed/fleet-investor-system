import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { FleetReportTable } from '@/components/tables/fleet-report-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { formatCurrency } from '@/lib/utils/format';
import type { FleetPerformanceRow } from '@/types/database';

export default async function FleetReportPage() {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const { data: rows } = await supabase
    .from('fleet_performance_table')
    .select('*')
    .order('profit_month', { ascending: false })
    .returns<FleetPerformanceRow[]>();

  const exportRows = (rows ?? []).map((r) => ({
    plate: r.plate_number,
    driver: r.current_driver_name ?? '—',
    revenue: r.revenue_month,
    expenses: r.expenses_month,
    profit: r.profit_month,
    occupancy_rate: r.occupancy_rate,
    status: r.occupancy_status,
  }));

  const totals = (rows ?? []).reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue_month,
      expenses: acc.expenses + r.expenses_month,
      profit: acc.profit + r.profit_month,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Relatório de Frota</h1>
        <ExportButtons
          title="Relatorio de Frota"
          rows={exportRows}
          columns={[
            { header: 'Placa', key: 'plate' },
            { header: 'Motorista', key: 'driver' },
            { header: 'Receita (mês)', key: 'revenue', type: 'currency' },
            { header: 'Despesas (mês)', key: 'expenses', type: 'currency' },
            { header: 'Lucro (mês)', key: 'profit', type: 'currency' },
            { header: 'Ocupação (%)', key: 'occupancy_rate', type: 'percentage' },
            { header: 'Status', key: 'status' },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Receita Total (mês)</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totals.revenue, locale)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Despesas Total (mês)</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(totals.expenses, locale)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Lucro Total (mês)</p>
          <p
            className={`text-lg font-semibold tabular-nums ${
              totals.profit >= 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {formatCurrency(totals.profit, locale)}
          </p>
        </div>
      </div>

      <FleetReportTable rows={rows ?? []} locale={locale} />
    </div>
  );
}
