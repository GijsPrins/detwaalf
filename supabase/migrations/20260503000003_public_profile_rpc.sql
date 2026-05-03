-- Returns completed participations for a public profile.
-- Encapsulates the is_public check so event_participations RLS stays strict.
create or replace function get_public_profile_participations(target_user_id uuid)
returns table(
  province_id        integer,
  actual_distance_km numeric,
  event_name         text,
  event_date         date
)
language sql
security definer
set search_path = public
as $$
  select
    e.province_id,
    ep.actual_distance_km,
    e.name  as event_name,
    e.date  as event_date
  from event_participations ep
  join events e on e.id = ep.event_id
  where ep.user_id               = target_user_id
    and ep.status                = 'completed'
    and ep.actual_distance_km    is not null
    and exists (
      select 1 from profiles p
      where p.id = target_user_id
        and (p.is_public = true or p.id = auth.uid())
    );
$$;
