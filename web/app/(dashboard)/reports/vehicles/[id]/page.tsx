import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { VehicleCashFlowDetailTable } from '@/components/tables/vehicle-cash-flow-detail-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { VehicleFinancialSummary, VehicleCashFlowDetail } from '@/types/database';

// CR-014: Vehicle Detail — clicking a vehicle in the Vehicle Report opens
// this screen, showing every financial movement since acquisition, with
// Excel export.
export default async function VehicleReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const [{ data: summary }, { data: movements }] = await Promise.all([
    supabase
      .from('vehicle_financial_summary')
      .select('*')
      .eq('vehicle_id', params.id)
      .single<VehicleFinancialSummary>(),
    supabase
      .from('vehicle_cash_flow_detail')
      .select('*')
      .eq('vehicle_id', params.id)
      .order('transaction_date', { ascending: false })
      .returns<VehicleCashFlowDetail[]>(),
  ]);

  if (!summary) {
    notFound();
  }

  const exportRows = (movements ?? []).map((m) => ({
    date: m.transaction_date,
    type: m.transaction_type === 'revenue' ? 'Receita' : 'Despesa',
    category: m.category_label,
    amount: m.transaction_type === 'expense' ? -m.amount : m.amount,
    mileage: m.mileage,
    notes: m.notes ?? '',
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reports/vehicles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{summary.plate_number}</h1>
            <p className="text-sm text-muted-foreground">
              {summary.brand} {summary.model}
            </p>
          </div>
        </div>
        <ExportButtons
          title={`Historico Financeiro - ${summary.plate_number}`}
          rows={exportRows}
          columns={[
            { header: 'Data', key: 'date', type: 'date' },
            { header: 'Tipo', key: 'type' },
            { header: 'Categoria', key: 'category' },
            { header: 'Valor', key: 'amount', type: 'currency' },
            { header: 'Quilometragem', key: 'mileage', type: 'number' },
            { header: 'Observações', key: 'notes' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Receita Total" value={formatCurrency(summary.total_revenue, locale)} />
        <KpiCard label="Despesa Total" value={formatCurrency(summary.total_expenses, locale)} />
        <KpiCard
          label="Lucro Acumulado"
          value={formatCurrency(summary.accumulated_profit, locale)}
          tone={summary.accumulated_profit >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="ROI"
          value={summary.roi_percentage != null ? formatPercentage(summary.roi_percentage, locale) : '—'}
          tone={(summary.roi_percentage ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Depreciação"
          value={formatCurrency(summary.depreciation, locale)}
          tone={summary.depreciation >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Lucro c/ Depreciação"
          value={formatCurrency(summary.accumulated_depreciated_profit, locale)}
        />
        <KpiCard
          label="Valor de Mercado Atual"
          value={summary.current_market_value ? formatCurrency(summary.current_market_value, locale) : '—'}
        />
        <KpiCard label="Valor de Aquisição" value={formatCurrency(summary.acquisition_value, locale)} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Histórico Financeiro Completo (desde a aquisição)
        </h2>
        <VehicleCashFlowDetailTable rows={movements ?? []} />
      </div>
    </div>
  );
}
