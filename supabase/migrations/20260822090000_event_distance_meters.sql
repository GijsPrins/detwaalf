-- Store exact event distance lengths in meters and derive medal categories
-- from those meters. The existing distance enum remains the public app input
-- for now, so current UI behavior does not change.

create or replace function public.event_distance_meters(
  p_distance public.event_distance
)
returns integer
language sql
immutable
strict
set search_path = public
as $$
  select case p_distance
    when '10k'::public.event_distance then 10000
    when '15k'::public.event_distance then 15000
    when '10_miles'::public.event_distance then 16093
    when 'half_marathon'::public.event_distance then 21097
    when '30k'::public.event_distance then 30000
    when 'marathon'::public.event_distance then 42195
  end
$$;

create or replace function public.medal_category_for_distance_meters(
  p_distance_meters integer
)
returns public.distance_category
language sql
immutable
strict
set search_path = public
as $$
  select case
    when p_distance_meters >= 42195 then 'marathon'::public.distance_category
    when p_distance_meters >= 21097 then 'half'::public.distance_category
    when p_distance_meters >= 10000 then '10k'::public.distance_category
  end
$$;

alter table public.event_distances
  add column distance_meters integer;

update public.event_distances
set distance_meters = public.event_distance_meters(distance)
where distance_meters is null;

alter table public.event_distances
  alter column distance_meters set not null,
  add constraint event_distances_distance_meters_minimum
    check (distance_meters >= 10000);

alter table public.event_distances
  add column medal_category public.distance_category
    generated always as (
      public.medal_category_for_distance_meters(distance_meters)
    ) stored;

alter table public.event_distances
  alter column medal_category set not null,
  add constraint event_distances_distance_category_matches_meters
    check (distance_category = medal_category);

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
