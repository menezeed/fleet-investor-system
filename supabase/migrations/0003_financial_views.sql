-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0003: Financial Views & Functions
--
-- Design principle: all profit/ROI math lives here, in the database, not in
-- the frontend. This guarantees the dashboard, vehicle reports, and investor
-- reports never disagree with each other (a common bug in spreadsheet-driven
-- fleet tools). Mirrors the approach used by QuickBooks/Fleetio-style systems
-- where reporting reads from pre-aggregated views, not raw transaction loops.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- vehicle_monthly_financials
-- Revenue, expenses and profit per vehicle per calendar month.
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
  select vehicle_id, date_trunc('month', revenue_date)::date as month,
         sum(amount) as total_revenue
  from revenues
  group by 1, 2
),
exp as (
  select vehicle_id, date_trunc('month', expense_date)::date as month,
         sum(amount) as total_expenses
  from expenses
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
  'Revenue, expenses, and net profit per vehicle, per month, from acquisition date to current month (zero-filled).';

-- ----------------------------------------------------------------------------
-- vehicle_financial_summary
-- Lifetime totals + ROI + depreciation-adjusted profit per vehicle.
-- ----------------------------------------------------------------------------

create view vehicle_financial_summary as
select
  v.id as vehicle_id,
  v.plate_number,
  v.brand,
  v.model,
  v.status,
  v.acquisition_cost,
  v.acquisition_value,
  v.current_market_value,
  coalesce(r.total_revenue, 0) as total_revenue,
  coalesce(e.total_expenses, 0) as total_expenses,
  coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0) as accumulated_profit,
  -- Profit considering depreciation = Net Profit + (Current Value - Acquisition Value)
  (coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
    + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0))
    as accumulated_depreciated_profit,
  -- ROI = Accumulated Profit / Acquisition Cost
  case when v.acquisition_cost > 0
    then round(((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0)) / v.acquisition_cost) * 100, 2)
    else null
  end as roi_percentage,
  -- ROI depreciated = (Accumulated Profit + depreciation delta) / Acquisition Cost
  case when v.acquisition_cost > 0
    then round((
      ((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
        + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0)))
      / v.acquisition_cost) * 100, 2)
    else null
  end as roi_depreciated_percentage
from vehicles v
left join (
  select vehicle_id, sum(amount) as total_revenue from revenues group by vehicle_id
) r on r.vehicle_id = v.id
left join (
  select vehicle_id, sum(amount) as total_expenses from expenses group by vehicle_id
) e on e.vehicle_id = v.id;

comment on view vehicle_financial_summary is
  'Lifetime financial summary per vehicle: profit, ROI, and depreciation-adjusted figures. Backs the Vehicle Report.';

-- ----------------------------------------------------------------------------
-- investor_vehicle_financials
-- Per-investor, per-vehicle share of profit based on active ownership %.
-- ----------------------------------------------------------------------------

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
  -- Investor Profit = Vehicle Profit x Ownership %, less admin fee
  round(vfs.accumulated_profit * (ip.ownership_percentage / 100.0)
        * (1 - ip.administration_fee_percentage / 100.0), 2) as investor_accumulated_profit,
  round(vfs.accumulated_depreciated_profit * (ip.ownership_percentage / 100.0)
        * (1 - ip.administration_fee_percentage / 100.0), 2) as investor_accumulated_depreciated_profit,
  round(v.acquisition_cost * (ip.ownership_percentage / 100.0), 2) as investor_acquisition_cost_share,
  round(coalesce(v.current_market_value, v.acquisition_value, 0) * (ip.ownership_percentage / 100.0), 2)
    as investor_portfolio_value_share
from investor_participations ip
join vehicles v on v.id = ip.vehicle_id
join vehicle_financial_summary vfs on vfs.vehicle_id = ip.vehicle_id
where ip.end_date is null;

comment on view investor_vehicle_financials is
  'Each investor''s profit share per vehicle, net of administration fee. Backs the Investor Report.';

-- ----------------------------------------------------------------------------
-- investor_monthly_financials
-- Per-investor, per-month profit share (for trend charts).
-- ----------------------------------------------------------------------------

create view investor_monthly_financials as
select
  ip.investor_id,
  vmf.month,
  sum(vmf.net_profit * (ip.ownership_percentage / 100.0)
      * (1 - ip.administration_fee_percentage / 100.0)) as investor_monthly_profit
from investor_participations ip
join vehicle_monthly_financials vmf on vmf.vehicle_id = ip.vehicle_id
where ip.end_date is null
group by ip.investor_id, vmf.month;

comment on view investor_monthly_financials is
  'Monthly profit share per investor across all their vehicles, for trend charts in the Investor Report.';

-- ----------------------------------------------------------------------------
-- fleet_dashboard_summary
-- Single-row summary for the main Dashboard screen.
-- ----------------------------------------------------------------------------

create view fleet_dashboard_summary as
select
  (select count(*) from vehicles) as total_vehicles,
  (select count(*) from vehicles where status = 'rented') as active_rentals,
  (select count(*) from vehicles where status = 'maintenance') as vehicles_in_maintenance,
  (select coalesce(sum(total_revenue), 0) from vehicle_monthly_financials
     where month = date_trunc('month', current_date)) as monthly_revenue,
  (select coalesce(sum(total_expenses), 0) from vehicle_monthly_financials
     where month = date_trunc('month', current_date)) as monthly_expenses,
  (select coalesce(sum(net_profit), 0) from vehicle_monthly_financials
     where month = date_trunc('month', current_date)) as monthly_net_profit,
  (select count(*) from vehicle_events
     where planned_date >= date_trunc('month', current_date)
       and planned_date < date_trunc('month', current_date) + interval '1 month') as events_this_month,
  (select count(*) from vehicle_events
     where planned_date >= date_trunc('month', current_date) + interval '1 month'
       and planned_date < date_trunc('month', current_date) + interval '2 months') as events_next_month_forecast;

comment on view fleet_dashboard_summary is 'Single-row aggregate backing the main Dashboard KPI cards.';

-- ----------------------------------------------------------------------------
-- fleet_performance_table
-- Per-vehicle current month performance, for the Dashboard table.
-- ----------------------------------------------------------------------------

create view fleet_performance_table as
select
  v.id as vehicle_id,
  v.plate_number,
  v.status,
  d.full_name as current_driver_name,
  coalesce(vmf.total_revenue, 0) as revenue_month,
  coalesce(vmf.total_expenses, 0) as expenses_month,
  coalesce(vmf.net_profit, 0) as profit_month,
  -- Days with an active assignment within the current calendar month
  case
    when va.id is not null then
      (least(current_date, coalesce(va.end_date, current_date))
       - greatest(date_trunc('month', current_date)::date, va.start_date) + 1)
    else 0
  end as occupancy_days_this_month,
  -- Occupancy rate (%) = occupied days / days elapsed so far this month
  case
    when va.id is not null then
      round(100.0 *
        (least(current_date, coalesce(va.end_date, current_date))
         - greatest(date_trunc('month', current_date)::date, va.start_date) + 1)
        / (extract(day from current_date)::numeric), 2)
    else 0
  end as occupancy_rate,
  case when va.id is not null and va.end_date is null then 'occupied'
       when v.status = 'maintenance' then 'maintenance'
       else 'idle'
  end as occupancy_status
from vehicles v
left join vehicle_assignments va on va.vehicle_id = v.id and va.end_date is null
left join drivers d on d.id = va.driver_id
left join vehicle_monthly_financials vmf
  on vmf.vehicle_id = v.id and vmf.month = date_trunc('month', current_date);

comment on view fleet_performance_table is 'Per-vehicle current-month performance row, backing the Dashboard Fleet Performance Table.';
