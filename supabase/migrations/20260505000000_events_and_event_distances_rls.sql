-- Allow authenticated users to create and manage their own events.
-- Admins and event managers keep broader management rights.

alter table public.events enable row level security;

alter table public.events
  alter column created_by set default auth.uid();

drop policy if exists "Events are publicly readable" on public.events;
drop policy if exists "Admins and managers can insert events" on public.events;
drop policy if exists "Admins and managers can update events" on public.events;
drop policy if exists "Admins and managers can delete events" on public.events;
drop policy if exists "Authenticated users can insert own events" on public.events;
drop policy if exists "Owners admins and managers can update events" on public.events;
drop policy if exists "Owners admins and managers can delete events" on public.events;

create policy "Events are publicly readable"
  on public.events
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert own events"
  on public.events
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Owners admins and managers can update events"
  on public.events
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or has_role('admin')
    or has_role('event_manager')
  )
  with check (
    created_by = auth.uid()
    or has_role('admin')
    or has_role('event_manager')
  );

create policy "Owners admins and managers can delete events"
  on public.events
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or has_role('admin')
    or has_role('event_manager')
  );

alter table public.event_distances enable row level security;

drop policy if exists "Admins can insert event distances" on public.event_distances;
drop policy if exists "Admins can update event distances" on public.event_distances;
drop policy if exists "Admins can delete event distances" on public.event_distances;
drop policy if exists "Admins and managers can insert event distances" on public.event_distances;
drop policy if exists "Admins and managers can update event distances" on public.event_distances;
drop policy if exists "Admins and managers can delete event distances" on public.event_distances;
drop policy if exists "Owners admins and managers can insert event distances" on public.event_distances;
drop policy if exists "Owners admins and managers can update event distances" on public.event_distances;
drop policy if exists "Owners admins and managers can delete event distances" on public.event_distances;

create policy "Owners admins and managers can insert event distances"
  on public.event_distances
  for insert
  to authenticated
  with check (
    has_role('admin')
    or has_role('event_manager')
    or exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  );

create policy "Owners admins and managers can update event distances"
  on public.event_distances
  for update
  to authenticated
  using (
    has_role('admin')
    or has_role('event_manager')
    or exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  )
  with check (
    has_role('admin')
    or has_role('event_manager')
    or exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  );

create policy "Owners admins and managers can delete event distances"
  on public.event_distances
  for delete
  to authenticated
  using (
    has_role('admin')
    or has_role('event_manager')
    or exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  );
