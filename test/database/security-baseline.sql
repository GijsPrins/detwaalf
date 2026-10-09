-- Isolated representative schema for the security migration; no real user data.
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key, email text not null);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create type public.event_distance as enum ('10k', '15k', '10_miles', 'half_marathon', '30k', 'marathon');
create type public.distance_category as enum ('10k', 'half', 'marathon');
create table public.profiles (id uuid primary key, is_public boolean default false, display_name text);
create table public.app_roles (role text primary key);
create table public.profile_roles (profile_id uuid, role text);
create table public.events (
  id uuid primary key default gen_random_uuid(), name text, event_date date,
  province_id smallint, location text, event_url text, registration_url text,
  registration_opens date, registration_deadline date, created_by uuid, updated_at timestamptz
);
create table public.event_distances (
  id uuid primary key default gen_random_uuid(), event_id uuid,
  distance public.event_distance, distance_category public.distance_category,
  distance_meters integer, sort_order integer, unique(event_id, distance)
);
create table public.event_participations (
  id uuid primary key default gen_random_uuid(), user_id uuid, event_id uuid,
  timing_url text, notes text
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(), user_id uuid, email text, message text
);
create function public.has_role(role_name text) returns boolean
language sql security definer as $$
  select exists(select 1 from public.profile_roles where profile_id = auth.uid() and role = role_name);
$$;
create function public.generate_profile_slug(text) returns text language sql security definer as $$select 'test-slug'::text$$;
create function public.get_event_cancellation_signals() returns bigint language sql security definer as $$select 0::bigint$$;
create function public.get_medal(numeric) returns text language sql security definer as $$select 'bronze'::text$$;
create function public.update_updated_at() returns trigger language plpgsql as $$begin return new; end$$;

grant select on public.profiles, public.event_participations to anon;
grant all on public.profiles, public.events, public.event_distances,
  public.event_participations, public.contact_messages to authenticated;
grant select on public.profile_roles to authenticated;
alter table public.profiles enable row level security;
alter table public.event_participations enable row level security;
alter table public.events enable row level security;
alter table public.contact_messages enable row level security;
create policy "profiles: public read" on public.profiles for select using (true);
create policy "participations: public read" on public.event_participations for select using (true);
create policy "own participations" on public.event_participations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "participations: admin can manage all" on public.event_participations for all
  using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "own events" on public.events for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "own messages" on public.contact_messages for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into auth.users values
  ('00000000-0000-0000-0000-000000000001', 'alice@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.test'),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.test');
insert into public.profiles values
  ('00000000-0000-0000-0000-000000000001', false, 'Alice'),
  ('00000000-0000-0000-0000-000000000002', false, 'Bob'),
  ('00000000-0000-0000-0000-000000000003', true, 'Admin');
insert into public.profile_roles values ('00000000-0000-0000-0000-000000000003', 'admin');
insert into public.event_participations(user_id, notes) values
  ('00000000-0000-0000-0000-000000000001', 'Alice private note'),
  ('00000000-0000-0000-0000-000000000002', 'Bob private note');
