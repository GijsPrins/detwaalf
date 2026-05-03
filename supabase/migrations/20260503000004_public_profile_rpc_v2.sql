-- Replace the RPC to use event_distances.distance_category instead of actual_distance_km.
-- actual_distance_km is never populated by the complete-participation flow, so the
-- previous version always returned empty results.
-- DROP required before CREATE because the return type changes.
drop function if exists get_public_profile_participations(uuid);

create function get_public_profile_participations(target_user_id uuid)
returns table(
  province_id       integer,
  distance_category text,
  event_name        text,
  event_date        date
)
language sql
security definer
set search_path = public
as $$
  select
    e.province_id,
    ed.distance_category::text,
    e.name       as event_name,
    e.event_date as event_date
  from event_participations ep
  join events e          on e.id  = ep.event_id
  join event_distances ed on ed.id = ep.event_distance_id
  where ep.user_id           = target_user_id
    and ep.status            = 'completed'
    and ep.event_distance_id is not null
    and exists (
      select 1 from profiles p
      where p.id = target_user_id
        and (p.is_public = true or p.id = auth.uid())
    );
$$;
