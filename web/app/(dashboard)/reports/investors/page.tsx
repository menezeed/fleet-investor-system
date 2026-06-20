import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { InvestorReportTable, type InvestorReportRow } from '@/components/tables/investor-report-table';
import { ExportButtons } from '@/components/reports/export-buttons';

export default async function InvestorReportPage() {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const { data: raw } = await supabase
    .from('investor_vehicle_financials')
    .select(
      `investor_id, ownership_percentage, administration_fee_percentage,
       investor_accumulated_profit, investor_accumulated_depreciated_profit, investor_portfolio_value_share,
       investors(full_name), vehicles(plate_number)`
    );

  // `any` here: Supabase infers a generic shape for nested joins (investors(...), vehicles(...))
  // without a generated Database type. Safe because we map explicitly into InvestorReportRow below.
  const rows: InvestorReportRow[] = (raw ?? []).map((r: any) => ({
    investor_id: r.investor_id,
    investor_name: r.investors?.full_name ?? '—',
    vehicle_plate: r.vehicles?.plate_number ?? '—',
    ownership_percentage: r.ownership_percentage,
    administration_fee_percentage: r.administration_fee_percentage,
    investor_accumulated_profit: r.investor_accumulated_profit,
    investor_accumulated_depreciated_profit: r.investor_accumulated_depreciated_profit,
    investor_portfolio_value_share: r.investor_portfolio_value_share,
  }));

  const exportRows = rows.map((r) => ({
    investor: r.investor_name,
    vehicle: r.vehicle_plate,
    ownership: r.ownership_percentage,
    admin_fee: r.administration_fee_percentage,
    profit: r.investor_accumulated_profit,
    depreciated_profit: r.investor_accumulated_depreciated_profit,
    portfolio_value: r.investor_portfolio_value_share,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Relatório de Investidores</h1>
        <ExportButtons
          title="Relatorio de Investidores"
          rows={exportRows}
          columns={[
            { header: 'Investidor', key: 'investor' },
            { header: 'Veículo', key: 'vehicle' },
            { header: 'Propriedade (%)', key: 'ownership', type: 'percentage' },
            { header: 'Taxa Adm. (%)', key: 'admin_fee', type: 'percentage' },
            { header: 'Lucro do Investidor', key: 'profit', type: 'currency' },
            { header: 'Lucro c/ Depreciação', key: 'depreciated_profit', type: 'currency' },
            { header: 'Valor do Portfólio', key: 'portfolio_value', type: 'currency' },
          ]}
        />
      </div>

      <InvestorReportTable rows={rows} locale={locale} />
    </div>
  );
}
