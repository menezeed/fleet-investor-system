-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0007: Change Request v1.1
--
-- Covers schema changes requested in "Fleet Management System - Change
-- Request – Version 1.1":
--   CR-003 Change 1: vehicles.model_year_alt (new field, next to model_year)
--   CR-003 Change 3: vehicles.chassis_number (new field)
--   CR-003 Change 4: consolidate acquisition_cost + acquisition_value into
--                    a single acquisition_value column
--   CR-005 Change 1/2: lookup_expense_types repurposed into an Event Catalog
--                       (name, description, frequency as free text) — same
--                       table, renamed and reshaped, per product decision to
--                       migrate existing data rather than keep both.
--
-- NOTE: per product decision, this migration accepts data loss on the
-- acquisition_value consolidation (test data only, no production data yet).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CR-003 Change 1 — Model Year (separate from the vehicle's model_year column
-- which already exists; the CR distinguishes "Year" [model_year, existing]
-- from "Model Year" [the model/version year, new]). We add a clearly named
-- second column to avoid confusion with the existing one.
-- ----------------------------------------------------------------------------

alter table vehicles add column model_year_alt int
  check (model_year_alt is null or model_year_alt between 1980 and 2100);

comment on column vehicles.model_year is 'CR-003: "Year" field — the vehicle''s manufacturing year.';
comment on column vehicles.model_year_alt is 'CR-003: "Model Year" field — the model/version year, shown next to Year.';

-- ----------------------------------------------------------------------------
-- CR-003 Change 3 — Chassis Number
-- ----------------------------------------------------------------------------

alter table vehicles add column chassis_number text;

-- ----------------------------------------------------------------------------
-- CR-003 Change 4 — Consolidate acquisition_cost + acquisition_value into a
-- single "Acquisition Value" field. Drops the old acquisition_value column
-- (per product decision) and renames acquisition_cost to acquisition_value.
-- Recreates the views that reference acquisition_cost.
-- ----------------------------------------------------------------------------

drop view if exists investor_vehicle_financials cascade;
drop view if exists vehicle_financial_summary cascade;

alter table vehicles drop column acquisition_value;
alter table vehicles rename column acquisition_cost to acquisition_value;

create view vehicle_financial_summary as
select
  v.id as vehicle_id,
  v.plate_number,
  v.brand,
  v.model,
  lvs.code as status_code,
  lvs.label as status_label,
  v.acquisition_value,
  v.current_market_value,
  coalesce(r.total_revenue, 0) as total_revenue,
  coalesce(e.total_expenses, 0) as total_expenses,
  coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0) as accumulated_profit,
  (coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
    + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0))
    as accumulated_depreciated_profit,
  case when v.acquisition_value > 0
    then round(((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0)) / v.acquisition_value) * 100, 2)
    else null
  end as roi_percentage,
  case when v.acquisition_value > 0
    then round((
      ((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
        + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0)))
      / v.acquisition_value) * 100, 2)
    else null
  end as roi_depreciated_percentage
from vehicles v
join lookup_vehicle_statuses lvs on lvs.id = v.status_id
left join (
  select vehicle_id, sum(amount) as total_revenue from revenues group by vehicle_id
) r on r.vehicle_id = v.id
left join (
  select vehicle_id, sum(amount) as total_expenses from expenses group by vehicle_id
) e on e.vehicle_id = v.id;

comment on view vehicle_financial_summary is
  'Lifetime financial summary per vehicle: profit, ROI, and depreciation-adjusted figures. Backs the Vehicle Report.';

create view investor_vehicle_financials as
select
  ip.investor_id,
  ip.vehicle_id,
  ip.ownership_percentage,
  ip.administration_fee_percentage,
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
-- CR-005 — Repurpose lookup_expense_types into an "Event Catalog"
-- (name, description, frequency as free text), per product decision to
-- migrate existing data into the new shape rather than keep both tables.
--
-- `label` becomes the catalog item's Name. `code` is kept internally (used
-- by expenses.expense_type_id FK) but is no longer shown to the user.
-- ----------------------------------------------------------------------------

alter table lookup_expense_types add column description text;
alter table lookup_expense_types add column frequency text;

comment on table lookup_expense_types is
  'CR-005: repurposed as the Event Catalog. Still backs expenses.expense_type_id; '
  'also referenced by vehicle_events.catalog_item_id (see below) for planned events.';
comment on column lookup_expense_types.label is 'Event Catalog "Name" field.';
comment on column lookup_expense_types.description is 'Event Catalog "Description" field (CR-005).';
comment on column lookup_expense_types.frequency is
  'Event Catalog "Frequency" field (CR-005) — free text, e.g. "Every 10,000 km", "Monthly". No validation in this version.';

-- ----------------------------------------------------------------------------
-- CR-004 — Events module: planned vs completed, catalog link, mileage.
-- vehicle_events already exists (planned_date, is_completed, value). We add
-- the missing pieces: link to the Event Catalog and a mileage field.
-- ----------------------------------------------------------------------------

alter table vehicle_events add column catalog_item_id uuid references lookup_expense_types(id) on delete set null;
alter table vehicle_events add column mileage int check (mileage is null or mileage >= 0);

comment on column vehicle_events.catalog_item_id is 'CR-004/CR-005: optional link to an Event Catalog entry (Name/Description/Frequency).';
comment on column vehicle_events.mileage is 'CR-004 Change 4: optional mileage reading at the time of the event.';

-- ----------------------------------------------------------------------------
-- CR-001 — Dashboard investor filter support.
-- The existing dashboard views are fleet-wide aggregates. To support
-- per-investor filtering without duplicating view logic, we add a
-- parameterized function that returns the same shape as
-- fleet_dashboard_summary, optionally scoped to one investor's vehicles
-- (via investor_participations). NULL = all investors (unchanged totals).
-- ----------------------------------------------------------------------------

create or replace function fleet_dashboard_summary_for_investor(p_investor_id uuid default null)
returns table (
  total_vehicles bigint,
  active_rentals bigint,
  vehicles_in_maintenance bigint,
  monthly_revenue numeric,
  monthly_expenses numeric,
  monthly_net_profit numeric,
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
  'CR-001 Change 1: dashboard summary optionally scoped to a single investor''s fleet. NULL = all investors.';

-- Same idea for the per-vehicle performance table used on the dashboard.
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
  'CR-001 Change 1: per-vehicle performance rows optionally scoped to a single investor''s fleet.';
