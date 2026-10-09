-- Reproduce the production hotfix without removing owner or administrator policies.
alter table public.profiles enable row level security;
alter table public.event_participations enable row level security;
drop policy if exists "profiles: public read" on public.profiles;
drop policy if exists "participations: public read" on public.event_participations;
revoke select on public.event_participations from anon, public;

drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable" on public.profiles
  for select to anon, authenticated
  using (is_public = true or id = (select auth.uid()));

drop policy if exists "Users can view own participations" on public.event_participations;
create policy "Users can view own participations" on public.event_participations
  for select to authenticated using (user_id = (select auth.uid()));

-- Constraints protect every write path, including RPCs and direct Data API writes.
create or replace function public.is_safe_http_url(value text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select value is null or value = '' or (
    value ~* '^https?://[^/?#@[:space:]\\]+([/?#][^[:space:]\\]*)?$'
    and value !~ '[[:cntrl:]]'
  );
$$;

alter table public.events
  add constraint events_event_url_http check (public.is_safe_http_url(event_url)),
  add constraint events_registration_url_http check (public.is_safe_http_url(registration_url));
alter table public.event_participations
  add constraint event_participations_timing_url_http check (public.is_safe_http_url(timing_url));

-- Role resolution remains a narrow RPC; callers cannot enumerate the role roster.
create or replace function public.has_role(role_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profile_roles
    where profile_id = auth.uid() and role = role_name
  );
$$;

alter table public.profile_roles enable row level security;
alter table public.app_roles enable row level security;
drop policy if exists "app_roles: public read" on public.app_roles;
create policy "app_roles: public read" on public.app_roles
  for select to anon, authenticated using (true);

drop policy if exists "profile_roles: admin can read all" on public.profile_roles;
drop policy if exists "profile_roles: user can read own" on public.profile_roles;
drop policy if exists "profile_roles: admin can insert" on public.profile_roles;
drop policy if exists "profile_roles: admin can delete" on public.profile_roles;
create policy "profile_roles: admin can read all" on public.profile_roles
  for select to authenticated using (public.has_role('admin'));
create policy "profile_roles: user can read own" on public.profile_roles
  for select to authenticated using (profile_id = (select auth.uid()));
create policy "profile_roles: admin can insert" on public.profile_roles
  for insert to authenticated with check (public.has_role('admin'));
create policy "profile_roles: admin can delete" on public.profile_roles
  for delete to authenticated using (public.has_role('admin'));
revoke select on public.profile_roles from public, anon, authenticated;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.has_role(text) to authenticated;
revoke all on function public.generate_profile_slug(text) from public, anon;
grant execute on function public.generate_profile_slug(text) to authenticated;
revoke all on function public.get_event_cancellation_signals() from public, anon;
grant execute on function public.get_event_cancellation_signals() to authenticated;

-- Existing legacy helpers also need a fixed lookup path.
alter function public.get_medal(numeric) set search_path = public, pg_temp;
alter function public.update_updated_at() set search_path = public, pg_temp;

-- Only the database can determine the sender's current account email.
-- This trigger is private and cannot be invoked through the Data API.
create schema if not exists private;
create or replace function private.set_contact_message_email()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'contact_message_requires_owner';
  end if;

  select email into new.email from auth.users where id = auth.uid();
  if new.email is null or new.email = '' then
    raise exception using errcode = '42501', message = 'contact_message_requires_email';
  end if;
  return new;
end;
$$;
revoke all on function private.set_contact_message_email() from public, anon, authenticated;
create trigger set_contact_message_email
  before insert on public.contact_messages
  for each row execute function private.set_contact_message_email();

-- Validate event RPC inputs before changing related records.
create or replace function public.create_event_with_distances(
  p_name text,
  p_event_date date,
  p_province_id integer,
  p_location text,
  p_event_url text,
  p_registration_url text,
  p_registration_opens date,
  p_registration_deadline date,
  p_distances jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if not public.is_safe_http_url(p_event_url)
    or not public.is_safe_http_url(p_registration_url) then
    raise exception using errcode = '22023', message = 'event_url_requires_http_or_https';
  end if;

  if p_distances is null
    or jsonb_typeof(p_distances) <> 'array'
    or jsonb_array_length(p_distances) = 0
  then
    raise exception 'At least one event distance is required';
  end if;

  insert into public.events (
    name,
    event_date,
    province_id,
    location,
    event_url,
    registration_url,
    registration_opens,
    registration_deadline,
    created_by
  )
  values (
    p_name,
    p_event_date,
    p_province_id::smallint,
    nullif(p_location, ''),
    nullif(p_event_url, ''),
    nullif(p_registration_url, ''),
    p_registration_opens,
    p_registration_deadline,
    auth.uid()
  )
  returning id into v_event_id;

  insert into public.event_distances (
    event_id,
    distance,
    distance_category,
    distance_meters,
    sort_order
  )
  select
    v_event_id,
    parsed.distance,
    public.medal_category_for_distance_meters(parsed.distance_meters),
    parsed.distance_meters,
    parsed.sort_order
  from (
    select
      (d.item->>'distance')::public.event_distance as distance,
      public.event_distance_meters(
        (d.item->>'distance')::public.event_distance
      ) as distance_meters,
      (d.sort_order - 1)::integer as sort_order
    from jsonb_array_elements(p_distances) with ordinality as d(item, sort_order)
  ) parsed;

  return v_event_id;
end;
$$;

create or replace function public.update_event_with_distances(
  p_id uuid,
  p_name text,
  p_event_date date,
  p_province_id integer,
  p_location text,
  p_event_url text,
  p_registration_url text,
  p_registration_opens date,
  p_registration_deadline date,
  p_distances jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if not public.is_safe_http_url(p_event_url)
    or not public.is_safe_http_url(p_registration_url) then
    raise exception using errcode = '22023', message = 'event_url_requires_http_or_https';
  end if;

  if p_distances is null
    or jsonb_typeof(p_distances) <> 'array'
    or jsonb_array_length(p_distances) = 0
  then
    raise exception 'At least one event distance is required';
  end if;

  update public.events
  set
    name = p_name,
    event_date = p_event_date,
    province_id = p_province_id::smallint,
    location = nullif(p_location, ''),
    event_url = nullif(p_event_url, ''),
    registration_url = nullif(p_registration_url, ''),
    registration_opens = p_registration_opens,
    registration_deadline = p_registration_deadline,
    updated_at = now()
  where id = p_id
  returning id into v_event_id;

  if v_event_id is null then
    raise exception 'Event not found or not editable';
  end if;

  delete from public.event_distances existing
  where existing.event_id = p_id
    and not exists (
      select 1
      from jsonb_array_elements(p_distances) as incoming(item)
      where (incoming.item->>'distance')::public.event_distance = existing.distance
    );

  insert into public.event_distances (
    event_id,
    distance,
    distance_category,
    distance_meters,
    sort_order
  )
  select
    p_id,
    parsed.distance,
    public.medal_category_for_distance_meters(parsed.distance_meters),
    parsed.distance_meters,
    parsed.sort_order
  from (
    select
      (d.item->>'distance')::public.event_distance as distance,
      public.event_distance_meters(
        (d.item->>'distance')::public.event_distance
      ) as distance_meters,
      (d.sort_order - 1)::integer as sort_order
    from jsonb_array_elements(p_distances) with ordinality as d(item, sort_order)
  ) parsed
  on conflict (event_id, distance) do update
  set
    distance_category = excluded.distance_category,
    distance_meters = excluded.distance_meters,
    sort_order = excluded.sort_order;

  return p_id;
end;
$$;
