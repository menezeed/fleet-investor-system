// Central registry of the 5 editable lookup tables. Adding a new editable
// combo in the future means adding one entry here plus a route folder.

export interface LookupConfig {
  /** Supabase table name */
  table: string;
  /** Used in URLs: /settings/lookups/[slug] */
  slug: string;
  /** Page title and breadcrumb label */
  title: string;
  /** Short description shown on the index page */
  description: string;
}

export const LOOKUP_CONFIGS: LookupConfig[] = [
  {
    table: 'lookup_revenue_types',
    slug: 'revenue-types',
    title: 'Tipos de Receita',
    description: 'Categorias usadas ao lançar uma receita (ex: Pagamento de Locação)',
  },
  {
    table: 'lookup_expense_types',
    slug: 'expense-types',
    title: 'Tipos de Despesa',
    description: 'Categorias usadas ao lançar uma despesa (ex: Combustível, Seguro)',
  },
  {
    table: 'lookup_driver_statuses',
    slug: 'driver-statuses',
    title: 'Status de Motorista',
    description: 'Situações possíveis para um motorista (ex: Ativo, Suspenso)',
  },
  {
    table: 'lookup_vehicle_statuses',
    slug: 'vehicle-statuses',
    title: 'Status de Veículo',
    description: 'Situações possíveis para um veículo (ex: Disponível, Manutenção)',
  },
  {
    table: 'lookup_document_types',
    slug: 'document-types',
    title: 'Tipos de Documento',
    description: 'Tipos de documento de identificação do investidor (ex: CPF, CNPJ)',
  },
];

export function getLookupConfig(slug: string): LookupConfig | undefined {
  return LOOKUP_CONFIGS.find((c) => c.slug === slug);
}
