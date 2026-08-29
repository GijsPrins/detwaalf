-- Keep medal eligibility derived from the canonical event distance even when
-- event_distances is written through the Data API instead of the write RPCs.

create or replace function public.enforce_event_distance_category()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.distance_meters := public.event_distance_meters(new.distance);
  new.distance_category :=
    public.medal_category_for_distance_meters(new.distance_meters);
  return new;
end;
$$;

drop trigger if exists enforce_event_distance_category
  on public.event_distances;

create trigger enforce_event_distance_category
  before insert or update of distance, distance_meters, distance_category
  on public.event_distances
  for each row
  execute function public.enforce_event_distance_category();

update public.event_distances
set
  distance_meters = public.event_distance_meters(distance),
  distance_category = public.medal_category_for_distance_meters(
    public.event_distance_meters(distance)
  );
