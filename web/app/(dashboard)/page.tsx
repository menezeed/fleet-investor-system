'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { FleetPerformanceTable } from '@/components/tables/fleet-performance-table';
import { FieldWrapper, Select } from '@/components/ui/form-fields';
import { formatCurrency } from '@/lib/utils/format';
import type { FleetDashboardSummary, FleetPerformanceRow, Investor } from '@/types/database';

// CR-001: investor filter at the top of the dashboard; all indicators and
// charts are recalculated for the selected investor's fleet (or all fleets,
// when "All Investors" is selected).
export default function DashboardPage() {
  const supabase = createClient();
  const t = useTranslations('dashboard');
  const locale = useLocale() as 'pt' | 'en';

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [summary, setSummary] = useState<FleetDashboardSummary | null>(null);
  const [performance, setPerformance] = useState<FleetPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('investors')
      .select('*')
      .eq('is_active', true)
      .order('full_name')
      .returns<Investor[]>()
      .then(({ data }) => setInvestors(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const investorParam = selectedInvestorId || null;

      const [summaryResult, performanceResult] = await Promise.all([
        supabase.rpc('fleet_dashboard_summary_for_investor', { p_investor_id: investorParam }),
        supabase.rpc('fleet_performance_table_for_investor', { p_investor_id: investorParam }),
      ]);

      const summaryData = (summaryResult.data?.[0] ?? null) as FleetDashboardSummary | null;
      const performanceData = (performanceResult.data ?? []) as FleetPerformanceRow[];

      setSummary(summaryData);
      setPerformance(performanceData.slice().sort((a, b) => b.profit_month - a.profit_month));
      setLoading(false);
    }

    load();
  }, [selectedInvestorId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <FieldWrapper label="Investidor" error={undefined} className="w-64">
          <Select value={selectedInvestorId} onChange={(e) => setSelectedInvestorId(e.target.value)}>
            <option value="">Todos os Investidores</option>
            {investors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name}
              </option>
            ))}
          </Select>
        </FieldWrapper>
      </div>

      {/* CR-001 (v1.3): totals moved from the first row to sit directly
          above their corresponding monthly indicators, in the second row. */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard label={t('totalVehicles')} value={String(summary?.total_vehicles ?? 0)} />
          <KpiCard label={t('activeRentals')} value={String(summary?.active_rentals ?? 0)} tone="positive" />
          <KpiCard
            label={t('inMaintenance')}
            value={String(summary?.vehicles_in_maintenance ?? 0)}
            tone="warning"
          />
          <KpiCard label={t('eventsThisMonth')} value={String(summary?.events_this_month ?? 0)} />
          <KpiCard label={t('eventsNextMonth')} value={String(summary?.events_next_month_forecast ?? 0)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Receita Total" value={formatCurrency(summary?.total_revenue ?? 0, locale)} />
          <KpiCard label="Despesa Total" value={formatCurrency(summary?.total_expenses ?? 0, locale)} />
          <KpiCard
            label="Lucro Líquido Total"
            value={formatCurrency(summary?.total_net_profit ?? 0, locale)}
            tone={(summary?.total_net_profit ?? 0) >= 0 ? 'positive' : 'negative'}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label={t('monthlyRevenue')} value={formatCurrency(summary?.monthly_revenue ?? 0, locale)} />
          <KpiCard label={t('monthlyExpenses')} value={formatCurrency(summary?.monthly_expenses ?? 0, locale)} />
          <KpiCard
            label={t('monthlyNetProfit')}
            value={formatCurrency(summary?.monthly_net_profit ?? 0, locale)}
            tone={(summary?.monthly_net_profit ?? 0) >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('performanceTable')}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <FleetPerformanceTable rows={performance} locale={locale} emptyMessage="—" />
        )}
      </div>
    </div>
  );
}
