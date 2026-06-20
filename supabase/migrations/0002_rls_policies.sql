-- ============================================================================
-- Fleet Investor Management System (V1)
-- Migration 0002: Row Level Security
--
-- V1 = admin-only system. Every authenticated profile with role='admin' has
-- full access. Policies are written per-table (not blanket) so that V2's
-- investor portal (read-only, scoped to own data) can be added later without
-- restructuring.
-- ============================================================================

alter table profiles enable row level security;
alter table investors enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table vehicle_assignments enable row level security;
alter table investor_participations enable row level security;
alter table revenues enable row level security;
alter table expenses enable row level security;
alter table vehicle_events enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- PROFILES: users can read/update their own profile; admins can read all
-- ----------------------------------------------------------------------------

create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- Generic admin-full-access policy, applied per table
-- ----------------------------------------------------------------------------

create policy "investors_admin_all" on investors
  for all using (is_admin()) with check (is_admin());

create policy "vehicles_admin_all" on vehicles
  for all using (is_admin()) with check (is_admin());

create policy "drivers_admin_all" on drivers
  for all using (is_admin()) with check (is_admin());

create policy "assignments_admin_all" on vehicle_assignments
  for all using (is_admin()) with check (is_admin());

create policy "participations_admin_all" on investor_participations
  for all using (is_admin()) with check (is_admin());

create policy "revenues_admin_all" on revenues
  for all using (is_admin()) with check (is_admin());

create policy "expenses_admin_all" on expenses
  for all using (is_admin()) with check (is_admin());

create policy "events_admin_all" on vehicle_events
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- Auto-create profile row when a new auth user signs up
-- ----------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
