-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0005: Editable Lookup Tables
--
-- Replaces 5 fixed Postgres enums (revenue_type, expense_type, driver_status,
-- vehicle_status, document_type) with editable lookup tables, so the admin
-- can create/rename/deactivate options from the UI without a code deploy.
--
-- Design choices:
-- - Each lookup table has a stable `code` (used internally, never shown to
--   the user) and a `label` (shown in the UI, editable).
-- - Deleting a lookup row that is referenced by existing records is blocked
--   by the foreign key (ON DELETE RESTRICT) — the database enforces this,
--   not just the UI.
-- - Existing enum columns are migrated to UUID foreign keys pointing at the
--   new lookup tables. Historical data is preserved by matching on the old
--   enum value as the new `code`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop views that depend on the enum columns we're about to remove
-- (vehicles.status, etc). They are recreated against the new shape in
-- migration 0006.
-- ----------------------------------------------------------------------------

drop view if exists investor_vehicle_financials cascade;
drop view if exists vehicle_financial_summary cascade;
drop view if exists fleet_dashboard_summary cascade;
drop view if exists fleet_performance_table cascade;

-- ----------------------------------------------------------------------------
-- Generic lookup table shape, one physical table per type (clearer FKs,
-- clearer RLS, and avoids a single giant polymorphic table).
-- ----------------------------------------------------------------------------

create table lookup_revenue_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lookup_expense_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lookup_driver_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lookup_vehicle_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lookup_document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'lookup_revenue_types', 'lookup_expense_types', 'lookup_driver_statuses',
    'lookup_vehicle_statuses', 'lookup_document_types'
  ])
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Seed default values (same as the old enums, so existing data keeps working)
-- ----------------------------------------------------------------------------

insert into lookup_revenue_types (code, label, sort_order) values
  ('rental_payment', 'Pagamento de Locação', 1),
  ('damage_reimbursement', 'Reembolso de Dano', 2),
  ('other', 'Outro', 99);

insert into lookup_expense_types (code, label, sort_order) values
  ('insurance', 'Seguro', 1),
  ('maintenance', 'Manutenção', 2),
  ('tire_replacement', 'Troca de Pneus', 3),
  ('ipva', 'IPVA', 4),
  ('registration', 'Licenciamento', 5),
  ('fine', 'Multa', 6),
  ('fuel', 'Combustível', 7),
  ('cleaning', 'Limpeza', 8),
  ('other', 'Outro', 99);

insert into lookup_driver_statuses (code, label, sort_order) values
  ('active', 'Ativo', 1),
  ('inactive', 'Inativo', 2),
  ('suspended', 'Suspenso', 3);

insert into lookup_vehicle_statuses (code, label, sort_order) values
  ('available', 'Disponível', 1),
  ('rented', 'Locado', 2),
  ('maintenance', 'Manutenção', 3),
  ('sold', 'Vendido', 4);

insert into lookup_document_types (code, label, sort_order) values
  ('cpf', 'CPF', 1),
  ('cnpj', 'CNPJ', 2),
  ('passport', 'Passaporte', 3),
  ('other', 'Outro', 99);

-- ----------------------------------------------------------------------------
-- Migrate existing enum columns to UUID foreign keys.
-- Strategy: add new nullable uuid column, backfill by matching code = old
-- enum value (cast to text), drop old column, rename new column, enforce
-- not-null + FK with ON DELETE RESTRICT (blocks deleting an in-use lookup row).
-- ----------------------------------------------------------------------------

-- revenues.revenue_type -> revenue_type_id
alter table revenues add column revenue_type_id uuid;
update revenues r set revenue_type_id = lrt.id
  from lookup_revenue_types lrt where lrt.code = r.revenue_type::text;
alter table revenues alter column revenue_type_id set not null;
alter table revenues add constraint fk_revenues_revenue_type
  foreign key (revenue_type_id) references lookup_revenue_types(id) on delete restrict;
alter table revenues drop column revenue_type;
create index idx_revenues_revenue_type on revenues(revenue_type_id);

-- expenses.expense_type -> expense_type_id
alter table expenses add column expense_type_id uuid;
update expenses e set expense_type_id = let_.id
  from lookup_expense_types let_ where let_.code = e.expense_type::text;
alter table expenses alter column expense_type_id set not null;
alter table expenses add constraint fk_expenses_expense_type
  foreign key (expense_type_id) references lookup_expense_types(id) on delete restrict;
alter table expenses drop column expense_type;
create index idx_expenses_expense_type on expenses(expense_type_id);

-- drivers.status -> status_id
alter table drivers add column status_id uuid;
update drivers d set status_id = lds.id
  from lookup_driver_statuses lds where lds.code = d.status::text;
alter table drivers alter column status_id set not null;
alter table drivers add constraint fk_drivers_status
  foreign key (status_id) references lookup_driver_statuses(id) on delete restrict;
alter table drivers drop column status;
create index idx_drivers_status_id on drivers(status_id);

-- vehicles.status -> status_id
alter table vehicles add column status_id uuid;
update vehicles v set status_id = lvs.id
  from lookup_vehicle_statuses lvs where lvs.code = v.status::text;
alter table vehicles alter column status_id set not null;
alter table vehicles add constraint fk_vehicles_status
  foreign key (status_id) references lookup_vehicle_statuses(id) on delete restrict;
alter table vehicles drop column status;
create index idx_vehicles_status_id on vehicles(status_id);

-- investors.document_type -> document_type_id
alter table investors add column document_type_id uuid;
update investors i set document_type_id = ldt.id
  from lookup_document_types ldt where ldt.code = i.document_type::text;
alter table investors alter column document_type_id set not null;
alter table investors add constraint fk_investors_document_type
  foreign key (document_type_id) references lookup_document_types(id) on delete restrict;
alter table investors drop column document_type;
create index idx_investors_document_type_id on investors(document_type_id);

-- ----------------------------------------------------------------------------
-- Drop the now-unused enum types (no columns reference them anymore)
-- ----------------------------------------------------------------------------

drop type if exists revenue_type;
drop type if exists expense_type;
drop type if exists driver_status;
drop type if exists vehicle_status;
drop type if exists document_type;

-- ----------------------------------------------------------------------------
-- RLS: same admin-full-access pattern as everything else
-- ----------------------------------------------------------------------------

alter table lookup_revenue_types enable row level security;
alter table lookup_expense_types enable row level security;
alter table lookup_driver_statuses enable row level security;
alter table lookup_vehicle_statuses enable row level security;
alter table lookup_document_types enable row level security;

create policy "lookup_revenue_types_admin_all" on lookup_revenue_types
  for all using (is_admin()) with check (is_admin());
create policy "lookup_expense_types_admin_all" on lookup_expense_types
  for all using (is_admin()) with check (is_admin());
create policy "lookup_driver_statuses_admin_all" on lookup_driver_statuses
  for all using (is_admin()) with check (is_admin());
create policy "lookup_vehicle_statuses_admin_all" on lookup_vehicle_statuses
  for all using (is_admin()) with check (is_admin());
create policy "lookup_document_types_admin_all" on lookup_document_types
  for all using (is_admin()) with check (is_admin());
