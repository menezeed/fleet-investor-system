import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { VehicleReportTable } from '@/components/tables/vehicle-report-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import type { VehicleFinancialSummary, FleetPerformanceRow } from '@/types/database';

export default async function VehicleReportPage() {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  // CR-014: Fleet Report removed; its relevant info (current driver,
  // occupancy status) is incorporated here via fleet_performance_table.
  const [{ data: rows }, { data: performance }] = await Promise.all([
    supabase
      .from('vehicle_financial_summary')
      .select('*')
      .order('accumulated_profit', { ascending: false })
      .returns<VehicleFinancialSummary[]>(),
    supabase.from('fleet_performance_table').select('*').returns<FleetPerformanceRow[]>(),
  ]);

  const occupancyByVehicle = new Map((performance ?? []).map((p) => [p.vehicle_id, p]));

  const rowsWithOccupancy = (rows ?? []).map((v) => ({
    ...v,
    current_driver_name: occupancyByVehicle.get(v.vehicle_id)?.current_driver_name ?? null,
    occupancy_status: occupancyByVehicle.get(v.vehicle_id)?.occupancy_status ?? 'idle',
  }));

  const exportRows = rowsWithOccupancy.map((v) => ({
    plate: v.plate_number,
    vehicle: `${v.brand} ${v.model}`,
    driver: v.current_driver_name ?? '—',
    revenue: v.total_revenue,
    expenses: v.total_expenses,
    profit: v.accumulated_profit,
    depreciation: v.depreciation,
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
            { header: 'Motorista Atual', key: 'driver' },
            { header: 'Receita Total', key: 'revenue', type: 'currency' },
            { header: 'Despesa Total', key: 'expenses', type: 'currency' },
            { header: 'Lucro Acumulado', key: 'profit', type: 'currency' },
            { header: 'Depreciação', key: 'depreciation', type: 'currency' },
            { header: 'Lucro c/ Depreciação', key: 'depreciated_profit', type: 'currency' },
            { header: 'ROI (%)', key: 'roi', type: 'percentage' },
            { header: 'ROI Depreciado (%)', key: 'roi_depreciated', type: 'percentage' },
            { header: 'Valor de Mercado', key: 'market_value', type: 'currency' },
          ]}
        />
      </div>

      <VehicleReportTable rows={rowsWithOccupancy} locale={locale} />
    </div>
  );
}
