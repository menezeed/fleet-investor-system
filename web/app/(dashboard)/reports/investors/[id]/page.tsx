import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { InvestorVehicleDetailTable, type InvestorVehicleDetailRow } from '@/components/tables/investor-vehicle-detail-table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import type { InvestorReportSummary, Investor } from '@/types/database';

// CR-014: Investor Detail. Header shows consolidated totals; each vehicle
// row shows Vehicle Name, License Plate, Acquisition Date, Gross Revenue,
// Total Expenses, Net Profit, Profit Including Depreciation, Current Market Value.
export default async function InvestorReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const [{ data: investor }, { data: summary }, { data: rawVehicles }] = await Promise.all([
    supabase.from('investors').select('*').eq('id', params.id).single<Investor>(),
    supabase.from('investor_report_summary').select('*').eq('investor_id', params.id).single<InvestorReportSummary>(),
    supabase
      .from('investor_participations')
      .select(
        `vehicle_id,
         vehicles(plate_number, brand, model, acquisition_date, current_market_value, acquisition_value)`
      )
      .eq('investor_id', params.id)
      .is('end_date', null),
  ]);

  if (!investor) {
    notFound();
  }

  // `any` here: nested join shape without a generated Supabase type (same
  // pattern used elsewhere in the reports). Mapped explicitly below.
  const vehicleIds = (rawVehicles ?? []).map((r: any) => r.vehicle_id);

  const { data: financials } = await supabase
    .from('vehicle_financial_summary')
    .select('*')
    .in('vehicle_id', vehicleIds.length > 0 ? vehicleIds : ['00000000-0000-0000-0000-000000000000']);

  const vehicleRows: InvestorVehicleDetailRow[] = (rawVehicles ?? []).map((r: any) => {
    const fin = (financials ?? []).find((f: any) => f.vehicle_id === r.vehicle_id);
    return {
      vehicle_id: r.vehicle_id,
      plate_number: r.vehicles?.plate_number ?? '—',
      vehicle_name: r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : '—',
      acquisition_date: r.vehicles?.acquisition_date ?? '',
      total_revenue: fin?.total_revenue ?? 0,
      total_expenses: fin?.total_expenses ?? 0,
      accumulated_profit: fin?.accumulated_profit ?? 0,
      accumulated_depreciated_profit: fin?.accumulated_depreciated_profit ?? 0,
      current_market_value: r.vehicles?.current_market_value ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/reports/investors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{investor.full_name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Receita Total" value={formatCurrency(summary?.total_revenue ?? 0, locale)} />
        <KpiCard label="Despesa Total" value={formatCurrency(summary?.total_expenses ?? 0, locale)} />
        <KpiCard
          label="Lucro Líquido"
          value={formatCurrency(summary?.net_profit ?? 0, locale)}
          tone={(summary?.net_profit ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Valor de Mercado do Portfólio"
          value={formatCurrency(summary?.portfolio_market_value ?? 0, locale)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Veículos</h2>
        <InvestorVehicleDetailTable rows={vehicleRows} />
      </div>
    </div>
  );
}
