-- Save events and their offered distances atomically.
-- These functions run with the caller's privileges, so existing RLS policies
-- still decide whether the user may create or update the event and distances.

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
    sort_order
  )
  select
    v_event_id,
    (d.item->>'distance')::public.event_distance,
    (d.item->>'distanceCategory')::public.distance_category,
    (d.sort_order - 1)::integer
  from jsonb_array_elements(p_distances) with ordinality as d(item, sort_order);

  insert into public.event_participations (
    event_id,
    user_id,
    status
  )
  values (
    v_event_id,
    auth.uid(),
    'interested'
  );

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
    sort_order
  )
  select
    p_id,
    (d.item->>'distance')::public.event_distance,
    (d.item->>'distanceCategory')::public.distance_category,
    (d.sort_order - 1)::integer
  from jsonb_array_elements(p_distances) with ordinality as d(item, sort_order)
  on conflict (event_id, distance) do update
  set
    distance_category = excluded.distance_category,
    sort_order = excluded.sort_order;

  return p_id;
end;
$$;
