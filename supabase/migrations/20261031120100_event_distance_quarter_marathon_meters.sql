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
    when 'quarter_marathon'::public.event_distance then 10550
    when '15k'::public.event_distance then 15000
    when '10_miles'::public.event_distance then 16093
    when 'half_marathon'::public.event_distance then 21097
    when '30k'::public.event_distance then 30000
    when 'marathon'::public.event_distance then 42195
  end
$$;
