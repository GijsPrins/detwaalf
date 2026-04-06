-- RLS policies for event_participations
-- Each authenticated user may only read, create, and update their own rows.
-- user_id defaults to auth.uid() so the client never needs to send it.

alter table event_participations
  alter column user_id set default auth.uid();

alter table event_participations enable row level security;

-- user_id defaults to auth.uid() so clients never need to send it
alter table event_participations
  alter column user_id set default auth.uid();

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
