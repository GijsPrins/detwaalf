-- Re-assert RLS on event_participations to fix a data-leak where users could
-- read each other's participation records. Drop and recreate to ensure policies
-- are current regardless of prior state.

alter table event_participations enable row level security;

drop policy if exists "Users can view own participations" on event_participations;
drop policy if exists "Users can insert own participations" on event_participations;
drop policy if exists "Users can update own participations" on event_participations;
drop policy if exists "Users can delete own participations" on event_participations;

create policy "Users can view own participations"
  on event_participations
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own participations"
  on event_participations
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own participations"
  on event_participations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own participations"
  on event_participations
  for delete
  to authenticated
  using (user_id = auth.uid());
