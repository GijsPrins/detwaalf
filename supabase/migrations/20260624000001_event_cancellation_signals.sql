create or replace function public.get_event_cancellation_signals()
returns table (
  event_id uuid,
  cancelled_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mine.event_id,
    count(cancelled.id)::bigint as cancelled_count
  from public.event_participations mine
  join public.event_participations cancelled
    on cancelled.event_id = mine.event_id
   and cancelled.status = 'cancelled'
  where mine.user_id = auth.uid()
    and mine.status in ('interested', 'signed_up')
  group by mine.event_id
$$;

grant execute on function public.get_event_cancellation_signals() to authenticated;
