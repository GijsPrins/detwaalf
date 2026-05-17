-- Creating an event should not implicitly choose the creator's participation
-- status or distance. Users pick their own participation explicitly after
-- creation, especially for events with multiple distances.

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

  return v_event_id;
end;
$$;
