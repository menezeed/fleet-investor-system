import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { FleetPerformanceTable } from '@/components/tables/fleet-performance-table';
import { formatCurrency } from '@/lib/utils/format';
import type { FleetDashboardSummary, FleetPerformanceRow } from '@/types/database';

export default async function DashboardPage() {
  const supabase = createClient();
  const t = await getTranslations('dashboard');
  const locale = (await getLocale()) as 'pt' | 'en';

  const { data: summary } = await supabase
    .from('fleet_dashboard_summary')
    .select('*')
    .single<FleetDashboardSummary>();

  const { data: performance } = await supabase
    .from('fleet_performance_table')
    .select('*')
    .order('profit_month', { ascending: false })
    .returns<FleetPerformanceRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={t('totalVehicles')} value={String(summary?.total_vehicles ?? 0)} />
        <KpiCard label={t('activeRentals')} value={String(summary?.active_rentals ?? 0)} tone="positive" />
        <KpiCard
          label={t('inMaintenance')}
          value={String(summary?.vehicles_in_maintenance ?? 0)}
          tone="warning"
        />
        <KpiCard
          label={t('monthlyNetProfit')}
          value={formatCurrency(summary?.monthly_net_profit ?? 0, locale)}
          tone={(summary?.monthly_net_profit ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard label={t('monthlyRevenue')} value={formatCurrency(summary?.monthly_revenue ?? 0, locale)} />
        <KpiCard label={t('monthlyExpenses')} value={formatCurrency(summary?.monthly_expenses ?? 0, locale)} />
        <KpiCard label={t('eventsThisMonth')} value={String(summary?.events_this_month ?? 0)} />
        <KpiCard label={t('eventsNextMonth')} value={String(summary?.events_next_month_forecast ?? 0)} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('performanceTable')}</h2>
        <FleetPerformanceTable rows={performance ?? []} locale={locale} emptyMessage="—" />
      </div>
    </div>
  );
}
