-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0001: Initial Schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type vehicle_status as enum ('available', 'rented', 'maintenance', 'sold');
create type driver_status as enum ('active', 'inactive', 'suspended');
create type revenue_type as enum ('rental_payment', 'damage_reimbursement', 'other');
create type expense_type as enum (
  'insurance', 'maintenance', 'tire_replacement', 'ipva',
  'registration', 'fine', 'fuel', 'cleaning', 'other'
);
create type document_type as enum ('cpf', 'cnpj', 'passport', 'other');
create type app_role as enum ('admin');

-- ----------------------------------------------------------------------------
-- PROFILES (extends Supabase auth.users)
-- ----------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null default 'admin',
  preferred_language text not null default 'pt' check (preferred_language in ('pt', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Extends auth.users with app-specific fields. V1 = admin-only role.';

-- ----------------------------------------------------------------------------
-- INVESTORS
-- ----------------------------------------------------------------------------

create table investors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  document_type document_type not null default 'cpf',
  document_number text not null,
  pix_number text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip_code text,
  address_country text default 'BR',
  registration_date date not null default current_date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create unique index idx_investors_document_number on investors(document_number) where is_active = true;
create index idx_investors_full_name on investors using gin (full_name gin_trgm_ops);

comment on table investors is 'Fleet investors who own (partial or full) stakes in vehicles.';

-- ----------------------------------------------------------------------------
-- VEHICLES
-- ----------------------------------------------------------------------------

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null,
  brand text not null,
  model text not null,
  model_year int not null check (model_year between 1980 and 2100),
  color text,
  renavam text,
  crv_number text,
  acquisition_date date not null,
  acquisition_cost numeric(12,2) not null check (acquisition_cost >= 0),
  acquisition_value numeric(12,2) check (acquisition_value >= 0),
  current_market_value numeric(12,2) check (current_market_value >= 0),
  acquisition_mileage int check (acquisition_mileage >= 0),
  current_mileage int check (current_mileage >= 0),
  status vehicle_status not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create unique index idx_vehicles_plate_number on vehicles(plate_number);
create index idx_vehicles_status on vehicles(status);

comment on table vehicles is 'Fleet vehicles. May be owned by one or multiple investors via investor_participations.';

-- ----------------------------------------------------------------------------
-- DRIVERS
-- ----------------------------------------------------------------------------

create table drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  tax_id text,
  start_date date not null default current_date,
  status driver_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index idx_drivers_status on drivers(status);
create index idx_drivers_full_name on drivers using gin (full_name gin_trgm_ops);

comment on table drivers is 'App/Uber drivers who rent fleet vehicles.';

-- ----------------------------------------------------------------------------
-- VEHICLE ASSIGNMENTS (driver <-> vehicle, time-boxed)
-- ----------------------------------------------------------------------------

create table vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  driver_id uuid not null references drivers(id) on delete restrict,
  start_date date not null,
  end_date date,
  monthly_rental_value numeric(12,2) not null check (monthly_rental_value >= 0),
  is_active boolean generated always as (end_date is null) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  constraint chk_end_after_start check (end_date is null or end_date >= start_date)
);

create index idx_assignments_vehicle on vehicle_assignments(vehicle_id);
create index idx_assignments_driver on vehicle_assignments(driver_id);

-- Only one active (open-ended) assignment per vehicle at a time
create unique index idx_one_active_assignment_per_vehicle
  on vehicle_assignments(vehicle_id) where (end_date is null);

comment on table vehicle_assignments is 'Tracks which driver is using which vehicle, and when.';

-- ----------------------------------------------------------------------------
-- INVESTOR PARTICIPATIONS (investor <-> vehicle ownership %)
-- ----------------------------------------------------------------------------

create table investor_participations (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investors(id) on delete restrict,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  ownership_percentage numeric(5,2) not null check (ownership_percentage > 0 and ownership_percentage <= 100),
  administration_fee_percentage numeric(5,2) not null default 0 check (administration_fee_percentage >= 0 and administration_fee_percentage <= 100),
  effective_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id),
  unique (investor_id, vehicle_id, effective_date)
);

create index idx_participations_investor on investor_participations(investor_id);
create index idx_participations_vehicle on investor_participations(vehicle_id);

comment on table investor_participations is
  'Ownership stake of each investor in each vehicle. Sum of active ownership_percentage per vehicle must equal 100.';

-- ----------------------------------------------------------------------------
-- REVENUES
-- ----------------------------------------------------------------------------

create table revenues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  driver_id uuid references drivers(id) on delete set null,
  revenue_date date not null,
  revenue_type revenue_type not null default 'rental_payment',
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index idx_revenues_vehicle on revenues(vehicle_id);
create index idx_revenues_date on revenues(revenue_date);
create index idx_revenues_vehicle_date on revenues(vehicle_id, revenue_date);

comment on table revenues is 'Audit-tracked revenue entries per vehicle.';

-- ----------------------------------------------------------------------------
-- EXPENSES
-- ----------------------------------------------------------------------------

create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  expense_date date not null,
  expense_type expense_type not null default 'other',
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index idx_expenses_vehicle on expenses(vehicle_id);
create index idx_expenses_date on expenses(expense_date);
create index idx_expenses_vehicle_date on expenses(vehicle_id, expense_date);

comment on table expenses is 'Audit-tracked expense entries per vehicle.';

-- ----------------------------------------------------------------------------
-- VEHICLE EVENTS (maintenance reminders, planned events, etc.)
-- ----------------------------------------------------------------------------

create table vehicle_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  description text not null,
  planned_date date,
  value numeric(12,2),
  is_completed boolean not null default false,
  completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index idx_events_vehicle on vehicle_events(vehicle_id);
create index idx_events_planned_date on vehicle_events(planned_date);

comment on table vehicle_events is 'Planned or historical vehicle events (e.g. maintenance, inspections).';

-- ----------------------------------------------------------------------------
-- updated_at trigger (applied to every table with that column)
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'investors', 'vehicles', 'drivers', 'vehicle_assignments',
    'investor_participations', 'revenues', 'expenses', 'vehicle_events'
  ])
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end $$;
