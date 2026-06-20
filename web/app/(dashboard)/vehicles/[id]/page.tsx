import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ParticipationsTable, type ParticipationRow } from '@/components/tables/participations-table';
import { Button } from '@/components/ui/button';
import { AddParticipationForm } from '@/components/forms/add-participation-form';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import type { Vehicle, VehicleFinancialSummary, Investor } from '@/types/database';

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const locale = (await getLocale()) as 'pt' | 'en';

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single<Vehicle>();

  if (!vehicle) {
    notFound();
  }

  const [{ data: summary }, { data: participations }, { data: investors }] = await Promise.all([
    supabase.from('vehicle_financial_summary').select('*').eq('vehicle_id', params.id).single<VehicleFinancialSummary>(),
    supabase
      .from('investor_participations')
      .select('id, investor_id, ownership_percentage, administration_fee_percentage, investors(full_name)')
      .eq('vehicle_id', params.id)
      .is('end_date', null)
      .returns<ParticipationRow[]>(),
    supabase.from('investors').select('*').eq('is_active', true).order('full_name').returns<Investor[]>(),
  ]);

  const totalOwnership = (participations ?? []).reduce((sum, p) => sum + p.ownership_percentage, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{vehicle.plate_number}</h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.brand} {vehicle.model} · {vehicle.model_year}
          </p>
        </div>
        <Link href={`/vehicles/${vehicle.id}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Receita Total" value={formatCurrency(summary?.total_revenue ?? 0, locale)} />
        <KpiCard label="Despesa Total" value={formatCurrency(summary?.total_expenses ?? 0, locale)} />
        <KpiCard
          label="Lucro Acumulado"
          value={formatCurrency(summary?.accumulated_profit ?? 0, locale)}
          tone={(summary?.accumulated_profit ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="ROI"
          value={summary?.roi_percentage != null ? formatPercentage(summary.roi_percentage, locale) : '—'}
          tone={(summary?.roi_percentage ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Lucro Acum. (com depreciação)"
          value={formatCurrency(summary?.accumulated_depreciated_profit ?? 0, locale)}
        />
        <KpiCard
          label="ROI Depreciado"
          value={
            summary?.roi_depreciated_percentage != null
              ? formatPercentage(summary.roi_depreciated_percentage, locale)
              : '—'
          }
        />
        <KpiCard
          label="Valor de Mercado Atual"
          value={summary?.current_market_value ? formatCurrency(summary.current_market_value, locale) : '—'}
        />
        <KpiCard label="Custo de Aquisição" value={formatCurrency(summary?.acquisition_cost ?? 0, locale)} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Participações de Investidores</h2>
          <span
            className={
              totalOwnership === 100
                ? 'text-xs font-medium text-success'
                : 'text-xs font-medium text-warning'
            }
          >
            Total: {formatPercentage(totalOwnership, locale)}{' '}
            {totalOwnership !== 100 && '(deve somar 100%)'}
          </span>
        </div>

        <ParticipationsTable participations={participations ?? []} locale={locale} />

        {totalOwnership < 100 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <AddParticipationForm vehicleId={vehicle.id} investors={investors ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}
