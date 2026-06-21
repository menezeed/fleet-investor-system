-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0006: Recreate Views After Lookup Table Migration
--
-- Migration 0005 replaced the vehicle_status enum with lookup_vehicle_statuses
-- (status_id FK). The views below referenced the old `status` enum column
-- directly and must be recreated against the new shape. Each view now
-- exposes both `status_code` (stable identifier like 'available', 'rented' —
-- used by the frontend for badge colors/logic) and `status_label` (the
-- editable display text from the lookup table).
-- ============================================================================

drop view if exists investor_vehicle_financials;
drop view if exists vehicle_financial_summary;
drop view if exists fleet_dashboard_summary;
drop view if exists fleet_performance_table;

-- ----------------------------------------------------------------------------
-- vehicle_financial_summary (recreated)
-- ----------------------------------------------------------------------------

create view vehicle_financial_summary as
select
  v.id as vehicle_id,
  v.plate_number,
  v.brand,
  v.model,
  lvs.code as status_code,
  lvs.label as status_label,
  v.acquisition_cost,
  v.acquisition_value,
  v.current_market_value,
  coalesce(r.total_revenue, 0) as total_revenue,
  coalesce(e.total_expenses, 0) as total_expenses,
  coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0) as accumulated_profit,
  (coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
    + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0))
    as accumulated_depreciated_profit,
  case when v.acquisition_cost > 0
    then round(((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0)) / v.acquisition_cost) * 100, 2)
    else null
  end as roi_percentage,
  case when v.acquisition_cost > 0
    then round((
      ((coalesce(r.total_revenue, 0) - coalesce(e.total_expenses, 0))
        + (coalesce(v.current_market_value, v.acquisition_value, 0) - coalesce(v.acquisition_value, 0)))
      / v.acquisition_cost) * 100, 2)
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

-- ----------------------------------------------------------------------------
-- investor_vehicle_financials (recreated)
-- Depends on vehicle_financial_summary above — must be created after it.
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
-- fleet_dashboard_summary (recreated)
-- ----------------------------------------------------------------------------

create view fleet_dashboard_summary as
select
  (select count(*) from vehicles) as total_vehicles,
  (select count(*) from vehicles v join lookup_vehicle_statuses s on s.id = v.status_id where s.code = 'rented') as active_rentals,
  (select count(*) from vehicles v join lookup_vehicle_statuses s on s.id = v.status_id where s.code = 'maintenance') as vehicles_in_maintenance,
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
-- fleet_performance_table (recreated)
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
