-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0004: Business Rule Validations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Defensive drop: removes any previously-created version of these functions
-- (and their dependent triggers, via cascade) before recreating them. This
-- avoids stale function signatures lingering from earlier failed attempts.
-- ----------------------------------------------------------------------------

drop function if exists check_ownership_percentage() cascade;
drop function if exists check_assignment_after_acquisition() cascade;

-- ----------------------------------------------------------------------------
-- Rule: sum of active ownership_percentage per vehicle must never exceed 100%.
-- (We allow < 100% temporarily while building up participations, but block
-- any insert/update that would push the total over 100%.)
-- ----------------------------------------------------------------------------

create function check_ownership_percentage()
returns trigger language plpgsql as $$
declare
  total_pct numeric(6,2);
  error_message text;
begin
  select coalesce(sum(ownership_percentage), 0)
  into total_pct
  from investor_participations
  where vehicle_id = new.vehicle_id
    and end_date is null
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  total_pct := total_pct + new.ownership_percentage;

  if total_pct > 100.00 then
    error_message := format(
      'Total ownership for this vehicle would reach %s percent, which exceeds 100. Reduce existing participations first.',
      total_pct
    );
    raise exception '%', error_message;
  end if;

  return new;
end;
$$;

create trigger trg_check_ownership_percentage
  before insert or update on investor_participations
  for each row
  when (new.end_date is null)
  execute function check_ownership_percentage();

-- ----------------------------------------------------------------------------
-- Rule: vehicle_assignments and revenues/expenses should reference vehicles
-- that exist (enforced by FK already) — additional guard: assignment dates
-- must not predate the vehicle's acquisition_date.
-- ----------------------------------------------------------------------------

create function check_assignment_after_acquisition()
returns trigger language plpgsql as $$
declare
  v_acquisition_date date;
  error_message text;
begin
  select acquisition_date into v_acquisition_date from vehicles where id = new.vehicle_id;

  if new.start_date < v_acquisition_date then
    error_message := format(
      'Assignment start_date (%s) cannot precede vehicle acquisition_date (%s).',
      new.start_date, v_acquisition_date
    );
    raise exception '%', error_message;
  end if;

  return new;
end;
$$;

create trigger trg_check_assignment_after_acquisition
  before insert or update on vehicle_assignments
  for each row
  execute function check_assignment_after_acquisition();
