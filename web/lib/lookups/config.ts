// Central registry of the 4 generic editable lookup tables (Name-only combos).
// The 5th lookup, lookup_expense_types, was repurposed by CR-005 into the
// "Event Catalog" (Name, Description, Frequency) and has its own dedicated
// route/manager at /settings/event-catalog — see EventCatalogManager.

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
