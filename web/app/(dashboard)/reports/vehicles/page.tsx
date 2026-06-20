import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleReportTable } from '@/components/tables/vehicle-report-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import type { VehicleFinancialSummary } from '@/types/database';

export default async function VehicleReportPage() {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const { data: rows } = await supabase
    .from('vehicle_financial_summary')
    .select('*')
    .order('accumulated_profit', { ascending: false })
    .returns<VehicleFinancialSummary[]>();

  const exportRows = (rows ?? []).map((v) => ({
    plate: v.plate_number,
    vehicle: `${v.brand} ${v.model}`,
    revenue: v.total_revenue,
    expenses: v.total_expenses,
    profit: v.accumulated_profit,
    depreciated_profit: v.accumulated_depreciated_profit,
    roi: v.roi_percentage,
    roi_depreciated: v.roi_depreciated_percentage,
    market_value: v.current_market_value,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Relatório de Veículos</h1>
        <ExportButtons
          title="Relatorio de Veiculos"
          rows={exportRows}
          columns={[
            { header: 'Placa', key: 'plate' },
            { header: 'Veículo', key: 'vehicle' },
            { header: 'Receita Total', key: 'revenue', type: 'currency' },
            { header: 'Despesa Total', key: 'expenses', type: 'currency' },
            { header: 'Lucro Acumulado', key: 'profit', type: 'currency' },
            { header: 'Lucro c/ Depreciação', key: 'depreciated_profit', type: 'currency' },
            { header: 'ROI (%)', key: 'roi', type: 'percentage' },
            { header: 'ROI Depreciado (%)', key: 'roi_depreciated', type: 'percentage' },
            { header: 'Valor de Mercado', key: 'market_value', type: 'currency' },
          ]}
        />
      </div>

      <VehicleReportTable rows={rows ?? []} locale={locale} />
    </div>
  );
}
