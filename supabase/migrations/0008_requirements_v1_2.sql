-- ============================================================================
-- Fleet Investor Management System
-- Migration 0008: Requirements Update v1.2 + UAT v1.1 bug fixes
--
-- Covers:
--   UAT fix: VehicleEvent.description must be truly optional (CR-004 bug)
--   CR-007: vehicles.rental_value (new field, default rental amount)
--   CR-011/012/013: new unified `cash_flow` table replacing `revenues` and
--           `expenses`. Per product decision, no data migration — existing
--           test data in revenues/expenses is dropped.
--   CR-014: vehicle_financial_summary depreciation formula corrected to
--           (current_market_value - acquisition_value), which can be
--           negative; new investor_report_summary view (one row per
--           investor, consolidated).
--
-- Per product decision: test data loss is acceptable for this migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- UAT fix (CR-004): description must be truly optional.
-- ----------------------------------------------------------------------------

alter table vehicle_events alter column description drop not null;

-- ----------------------------------------------------------------------------
-- CR-007: Rental Value on Vehicle (default amount used when creating a Cash
-- Flow revenue entry for this vehicle).
-- ----------------------------------------------------------------------------

alter table vehicles add column rental_value numeric(12,2) check (rental_value is null or rental_value >= 0);
comment on column vehicles.rental_value is 'CR-007: default rental amount, pre-filled when creating a Cash Flow revenue entry for this vehicle.';

-- ----------------------------------------------------------------------------
-- CR-011/012/013: Unified Cash Flow table.
-- ----------------------------------------------------------------------------

create type cash_flow_transaction_type as enum ('revenue', 'expense');

create table cash_flow (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  transaction_date date not null,
  transaction_type cash_flow_transaction_type not null,
  category_id uuid not null,
  amount numeric(12,2) not null check (amount >= 0),
  mileage int check (mileage is null or mileage >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index idx_cash_flow_vehicle on cash_flow(vehicle_id);
create index idx_cash_flow_date on cash_flow(transaction_date);
create index idx_cash_flow_vehicle_date on cash_flow(vehicle_id, transaction_date);
create index idx_cash_flow_type on cash_flow(transaction_type);

comment on table cash_flow is
  'CR-011: unified financial transactions table, replacing revenues and expenses. '
  'category_id references lookup_revenue_types when transaction_type=revenue, '
  'lookup_expense_types when transaction_type=expense (enforced by trigger, not a literal FK).';

create trigger trg_set_updated_at before update on cash_flow
  for each row execute function set_updated_at();

create or replace function check_cash_flow_category()
returns trigger language plpgsql as $$
declare
  category_exists boolean;
begin
  if new.transaction_type = 'revenue' then
    select exists(select 1 from lookup_revenue_types where id = new.category_id) into category_exists;
    if not category_exists then
      raise exception 'category_id % is not a valid revenue category', new.category_id;
    end if;
  else
    select exists(select 1 from lookup_expense_types where id = new.category_id) into category_exists;
    if not category_exists then
      raise exception 'category_id % is not a valid expense category', new.category_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_cash_flow_category
  before insert or update on cash_flow
  for each row execute function check_cash_flow_category();

alter table cash_flow enable row level security;
create policy "cash_flow_admin_all" on cash_flow
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- Drop the old revenues/expenses tables (per product decision: test data
-- loss accepted). Also drop the views/functions that referenced them, then
-- recreate everything against cash_flow.
-- ----------------------------------------------------------------------------

drop view if exists investor_vehicle_financials cascade;
drop view if exists vehicle_financial_summary cascade;
drop view if exists vehicle_monthly_financials cascade;
drop view if exists fleet_dashboard_summary cascade;
drop view if exists fleet_performance_table cascade;
drop function if exists fleet_dashboard_summary_for_investor cascade;
drop function if exists fleet_performance_table_for_investor cascade;

drop table if exists revenues cascade;
drop table if exists expenses cascade;

-- ----------------------------------------------------------------------------
-- Recreate vehicle_monthly_financials against cash_flow.
-- ----------------------------------------------------------------------------

create view vehicle_monthly_financials as
with months as (
  select v.id as vehicle_id, date_trunc('month', d)::date as month
  from vehicles v
  cross join generate_series(
    date_trunc('month', v.acquisition_date),
    date_trunc('month', current_date),
    interval '1 month'
  ) d
),
rev as (
  select vehicle_id, date_trunc('month', transaction_date)::date as month, sum(amount) as total_revenue
  from cash_flow where transaction_type = 'revenue'
  group by 1, 2
),
exp as (
  select vehicle_id, date_trunc('month', transaction_date)::date as month, sum(amount) as total_expenses
  from cash_flow where transaction_type = 'expense'
  group by 1, 2
)
select
  m.vehicle_id,
  m.month,
  coalesce(rev.total_revenue, 0) as total_revenue,
  coalesce(exp.total_expenses, 0) as total_expenses,
  coalesce(rev.total_revenue, 0) - coalesce(exp.total_expenses, 0) as net_profit
from months m
left join rev on rev.vehicle_id = m.vehicle_id and rev.month = m.month
left join exp on exp.vehicle_id = m.vehicle_id and exp.month = m.month;

comment on view vehicle_monthly_financials is
  'Revenue, expenses, and net profit per vehicle, per month, from cash_flow.';

-- ----------------------------------------------------------------------------
-- Recreate vehicle_financial_summary with corrected depreciation formula
-- (CR-014): Depreciation = Current Market Value - Acquisition Value
-- (can be negative or positive). Profit Including Depreciation =
-- Total Revenue - Total Expenses + Depreciation.
-- ----------------------------------------------------------------------------

create view vehicle_financial_summary as
select
  v.id as vehicle_id,
  v.plate_number,
  v.brand,
  v.model,
  lvs.code as status_code,
  lvs.label as status_label,
  v.acquisition_date,
  v.acquisition_value,
  v.current_market_value,
  coalesce(r.total_revenue, 0) as total_revenue,
  coalesce(e.total_expenses, 0) as total_expenses,
  coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0) as accumulated_profit,
  (coalesce(v.current_market_value, v.acquisition_value) - v.acquisition_value) as depreciation,
  (coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
    + (coalesce(v.current_market_value, v.acquisition_value) - v.acquisition_value)
    as accumulated_depreciated_profit,
  case when v.acquisition_value > 0
    then round(((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0)) / v.acquisition_value) * 100, 2)
    else null
  end as roi_percentage,
  case when v.acquisition_value > 0
    then round((
      ((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
        + (coalesce(v.current_market_value, v.acquisition_value) - v.acquisition_value))
      / v.acquisition_value) * 100, 2)
    else null
  end as roi_depreciated_percentage
from vehicles v
join lookup_vehicle_statuses lvs on lvs.id = v.status_id
left join (
  select vehicle_id, sum(amount) as total_revenue from cash_flow where transaction_type = 'revenue' group by vehicle_id
) r on r.vehicle_id = v.id
left join (
  select vehicle_id, sum(amount) as total_expenses from cash_flow where transaction_type = 'expense' group by vehicle_id
) e on e.vehicle_id = v.id;

comment on view vehicle_financial_summary is
  'Lifetime financial summary per vehicle with corrected depreciation (CR-014). Backs the Vehicle Report.';

-- ----------------------------------------------------------------------------
-- Recreate investor_vehicle_financials (per-vehicle investor share).
-- ----------------------------------------------------------------------------

create view investor_vehicle_financials as
select
  ip.investor_id,
  ip.vehicle_id,
  ip.ownership_percentage,
  ip.administration_fee_percentage,
  ip.effective_date,
  vfs.total_revenue,
  vfs.total_expenses,
  vfs.accumulated_profit,
  vfs.accumulated_depreciated_profit,
  round(vfs.accumulated_profit * (ip.ownership_percentage / 100.0)
        * (1 - ip.administration_fee_percentage / 100.0), 2) as investor_accumulated_profit,
  round(vfs.accumulated_depreciated_profit * (ip.ownership_percentage / 100.0)
        * (1 - ip.administration_fee_percentage / 100.0), 2) as investor_accumulated_depreciated_profit,
  round(v.acquisition_value * (ip.ownership_percentage / 100.0), 2) as investor_acquisition_cost_share,
  round(coalesce(v.current_market_value, v.acquisition_value, 0) * (ip.ownership_percentage / 100.0), 2)
    as investor_portfolio_value_share
from investor_participations ip
join vehicles v on v.id = ip.vehicle_id
join vehicle_financial_summary vfs on vfs.vehicle_id = ip.vehicle_id
where ip.end_date is null;

comment on view investor_vehicle_financials is
  'Each investor''s profit share per vehicle, net of administration fee. Backs the Investor Report.';

-- ----------------------------------------------------------------------------
-- CR-014: Investor Report consolidated list — one row per investor, summing
-- across all their vehicles. Portfolio Market Value = sum of current market
-- value of all investor vehicles (full value, per the CR wording).
-- ----------------------------------------------------------------------------

create view investor_report_summary as
select
  ip.investor_id,
  i.full_name as investor_name,
  i.registration_date as first_investment_date,
  sum(vfs.total_revenue * (ip.ownership_percentage / 100.0)) as total_revenue,
  sum(vfs.total_expenses * (ip.ownership_percentage / 100.0)) as total_expenses,
  sum(
    vfs.accumulated_profit * (ip.ownership_percentage / 100.0) * (1 - ip.administration_fee_percentage / 100.0)
  ) as net_profit,
  sum(coalesce(v.current_market_value, v.acquisition_value, 0)) as portfolio_market_value
from investor_participations ip
join investors i on i.id = ip.investor_id
join vehicles v on v.id = ip.vehicle_id
join vehicle_financial_summary vfs on vfs.vehicle_id = ip.vehicle_id
where ip.end_date is null
group by ip.investor_id, i.full_name, i.registration_date;

comment on view investor_report_summary is
  'CR-014: one row per investor, consolidated across all owned vehicles. Backs the Investor Report list.';

-- ----------------------------------------------------------------------------
-- Recreate fleet_dashboard_summary (CR-006: now also exposes total_revenue /
-- total_expenses / total_net_profit lifetime totals for the selected scope).
-- ----------------------------------------------------------------------------

create or replace function fleet_dashboard_summary_for_investor(p_investor_id uuid default null)
returns table (
  total_vehicles bigint,
  active_rentals bigint,
  vehicles_in_maintenance bigint,
  monthly_revenue numeric,
  monthly_expenses numeric,
  monthly_net_profit numeric,
  total_revenue numeric,
  total_expenses numeric,
  total_net_profit numeric,
  events_this_month bigint,
  events_next_month_forecast bigint
)
language sql stable as $$
  with scoped_vehicles as (
    select v.id
    from vehicles v
    where p_investor_id is null
       or exists (
         select 1 from investor_participations ip
         where ip.vehicle_id = v.id and ip.investor_id = p_investor_id and ip.end_date is null
       )
  )
  select
    (select count(*) from scoped_vehicles) as total_vehicles,
    (select count(*) from vehicles v join lookup_vehicle_statuses s on s.id = v.status_id
       where v.id in (select id from scoped_vehicles) and s.code = 'rented') as active_rentals,
    (select count(*) from vehicles v join lookup_vehicle_statuses s on s.id = v.status_id
       where v.id in (select id from scoped_vehicles) and s.code = 'maintenance') as vehicles_in_maintenance,
    (select coalesce(sum(total_revenue), 0) from vehicle_monthly_financials
       where vehicle_id in (select id from scoped_vehicles)
         and month = date_trunc('month', current_date)) as monthly_revenue,
    (select coalesce(sum(total_expenses), 0) from vehicle_monthly_financials
       where vehicle_id in (select id from scoped_vehicles)
         and month = date_trunc('month', current_date)) as monthly_expenses,
    (select coalesce(sum(net_profit), 0) from vehicle_monthly_financials
       where vehicle_id in (select id from scoped_vehicles)
         and month = date_trunc('month', current_date)) as monthly_net_profit,
    (select coalesce(sum(amount), 0) from cash_flow
       where vehicle_id in (select id from scoped_vehicles) and transaction_type = 'revenue') as total_revenue,
    (select coalesce(sum(amount), 0) from cash_flow
       where vehicle_id in (select id from scoped_vehicles) and transaction_type = 'expense') as total_expenses,
    (select coalesce(sum(case when transaction_type = 'revenue' then amount else -amount end), 0) from cash_flow
       where vehicle_id in (select id from scoped_vehicles)) as total_net_profit,
    (select count(*) from vehicle_events
       where vehicle_id in (select id from scoped_vehicles)
         and planned_date >= date_trunc('month', current_date)
         and planned_date < date_trunc('month', current_date) + interval '1 month') as events_this_month,
    (select count(*) from vehicle_events
       where vehicle_id in (select id from scoped_vehicles)
         and planned_date >= date_trunc('month', current_date) + interval '1 month'
         and planned_date < date_trunc('month', current_date) + interval '2 months') as events_next_month_forecast;
$$;

comment on function fleet_dashboard_summary_for_investor is
  'CR-001/CR-006: dashboard summary optionally scoped to a single investor''s fleet, including lifetime totals.';

-- ----------------------------------------------------------------------------
-- Recreate fleet_performance_table + its investor-scoped wrapper.
-- ----------------------------------------------------------------------------

create view fleet_performance_table as
select
  v.id as vehicle_id,
  v.plate_number,
  lvs.code as status_code,
  lvs.label as status_label,
  d.full_name as current_driver_name,
  coalesce(vmf.total_revenue, 0) as revenue_month,
  coalesce(vmf.total_expenses, 0) as expenses_month,
  coalesce(vmf.net_profit, 0) as profit_month,
  case
    when va.id is not null then
      (least(current_date, coalesce(va.end_date, current_date))
       - greatest(date_trunc('month', current_date)::date, va.start_date) + 1)
    else 0
  end as occupancy_days_this_month,
  case
    when va.id is not null then
      round(100.0 *
        (least(current_date, coalesce(va.end_date, current_date))
         - greatest(date_trunc('month', current_date)::date, va.start_date) + 1)
        / (extract(day from current_date)::numeric), 2)
    else 0
  end as occupancy_rate,
  case when va.id is not null and va.end_date is null then 'occupied'
       when lvs.code = 'maintenance' then 'maintenance'
       else 'idle'
  end as occupancy_status
from vehicles v
join lookup_vehicle_statuses lvs on lvs.id = v.status_id
left join vehicle_assignments va on va.vehicle_id = v.id and va.end_date is null
left join drivers d on d.id = va.driver_id
left join vehicle_monthly_financials vmf
  on vmf.vehicle_id = v.id and vmf.month = date_trunc('month', current_date);

comment on view fleet_performance_table is 'Per-vehicle current-month performance row, backing the Dashboard Fleet Performance Table.';

create or replace function fleet_performance_table_for_investor(p_investor_id uuid default null)
returns table (
  vehicle_id uuid,
  plate_number text,
  status_code text,
  status_label text,
  current_driver_name text,
  revenue_month numeric,
  expenses_month numeric,
  profit_month numeric,
  occupancy_days_this_month numeric,
  occupancy_rate numeric,
  occupancy_status text
)
language sql stable as $$
  select fpt.*
  from fleet_performance_table fpt
  where p_investor_id is null
     or exists (
       select 1 from investor_participations ip
       where ip.vehicle_id = fpt.vehicle_id and ip.investor_id = p_investor_id and ip.end_date is null
     );
$$;

comment on function fleet_performance_table_for_investor is
  'CR-001: per-vehicle performance rows optionally scoped to a single investor''s fleet.';

-- ----------------------------------------------------------------------------
-- CR-014: Vehicle Detail — every financial movement since acquisition.
-- ----------------------------------------------------------------------------

create view vehicle_cash_flow_detail as
select
  cf.id,
  cf.vehicle_id,
  cf.transaction_date,
  cf.transaction_type,
  case when cf.transaction_type = 'revenue' then lrt.label else let_.label end as category_label,
  cf.amount,
  cf.mileage,
  cf.notes
from cash_flow cf
left join lookup_revenue_types lrt on cf.transaction_type = 'revenue' and lrt.id = cf.category_id
left join lookup_expense_types let_ on cf.transaction_type = 'expense' and let_.id = cf.category_id;

comment on view vehicle_cash_flow_detail is
  'CR-014: full transaction history per vehicle, with resolved category label. Backs the Vehicle Detail screen.';
