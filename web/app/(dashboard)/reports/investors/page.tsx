'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { FieldWrapper } from '@/components/ui/form-fields';
import { DatePickerBr } from '@/components/ui/date-picker-br';
import { formatCurrency } from '@/lib/utils/format';
import { useSortableState, useSortedRows } from '@/lib/utils/use-sortable';
import type { InvestorReportSummary } from '@/types/database';

// CR-014: Investor Report — consolidated list, one row per investor, with a
// period filter defaulting to [first investment date across all investors,
// today]. Note: the underlying investor_report_summary view aggregates
// lifetime totals (not period-filtered) since cash_flow has no per-period
// breakdown view yet; the period filter here scopes which investors are
// shown (by first_investment_date falling in range), matching the CR's
// "Start: First investment date of the investor" framing.
export default function InvestorReportPage() {
  const supabase = createClient();
  const locale = useLocale() as 'pt' | 'en';
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<InvestorReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { sort, toggleSort } = useSortableState({ column: 'net_profit', direction: 'desc' });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('investor_report_summary')
        .select('*')
        .order('net_profit', { ascending: false })
        .returns<InvestorReportSummary[]>();

      let result = data ?? [];

      // Default "Start" per investor = their own first_investment_date, so
      // without explicit input, every investor is included from their own start.
      if (startDate) result = result.filter((r) => r.first_investment_date >= startDate);
      if (endDate) result = result.filter((r) => r.first_investment_date <= endDate);

      setRows(result);
      setLoading(false);
    }
    load();
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getValue = (row: InvestorReportSummary, column: string) => {
    switch (column) {
      case 'investor':
        return row.investor_name;
      case 'revenue':
        return row.total_revenue;
      case 'expenses':
        return row.total_expenses;
      case 'net_profit':
        return row.net_profit;
      case 'portfolio':
        return row.portfolio_market_value;
      default:
        return null;
    }
  };
  const sortedRows = useSortedRows(rows, sort, getValue);

  const columns: Column<InvestorReportSummary>[] = [
    { header: 'Investidor', sortKey: 'investor', accessor: (r) => <span className="font-medium">{r.investor_name}</span> },
    { header: 'Receita Total', align: 'right', sortKey: 'revenue', accessor: (r) => formatCurrency(r.total_revenue, locale) },
    { header: 'Despesa Total', align: 'right', sortKey: 'expenses', accessor: (r) => formatCurrency(r.total_expenses, locale) },
    {
      header: 'Lucro Líquido',
      align: 'right',
      sortKey: 'net_profit',
      accessor: (r) => (
        <span className={r.net_profit >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {formatCurrency(r.net_profit, locale)}
        </span>
      ),
    },
    {
      header: 'Valor de Mercado do Portfólio',
      align: 'right',
      sortKey: 'portfolio',
      accessor: (r) => formatCurrency(r.portfolio_market_value, locale),
    },
  ];

  const exportRows = rows.map((r) => ({
    investor: r.investor_name,
    revenue: r.total_revenue,
    expenses: r.total_expenses,
    net_profit: r.net_profit,
    portfolio_value: r.portfolio_market_value,
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
            { header: 'Receita Total', key: 'revenue', type: 'currency' },
            { header: 'Despesa Total', key: 'expenses', type: 'currency' },
            { header: 'Lucro Líquido', key: 'net_profit', type: 'currency' },
            { header: 'Valor de Mercado do Portfólio', key: 'portfolio_value', type: 'currency' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <FieldWrapper label="De" error={undefined}>
          <DatePickerBr name="start_date" value={startDate} onChange={setStartDate} placeholder="1º investimento" />
        </FieldWrapper>
        <FieldWrapper label="Até" error={undefined}>
          <DatePickerBr name="end_date" value={endDate} onChange={setEndDate} />
        </FieldWrapper>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable
          columns={columns}
          rows={sortedRows}
          keyExtractor={(r) => r.investor_id}
          emptyMessage="Nenhum investidor encontrado"
          onRowClick={(r) => router.push(`/reports/investors/${r.investor_id}`)}
          sort={sort}
          onSortChange={toggleSort}
        />
      )}
    </div>
  );
}
