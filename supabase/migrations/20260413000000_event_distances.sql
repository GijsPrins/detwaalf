-- Multi-distance support for events
-- Creates event_distances table, seeds from existing distance_category column,
-- links event_participations to a specific distance, then drops the column.

-- 1. Create the event_distances table
create table event_distances (
  id                uuid          primary key default gen_random_uuid(),
  event_id          uuid          not null references events(id) on delete cascade,
  distance_category distance_category not null,
  sort_order        smallint      not null default 0,
  created_at        timestamptz   not null default now()
);

-- One event can only offer the same distance category once
create unique index event_distances_event_id_category_key
  on event_distances (event_id, distance_category);

-- Fast lookup of distances for a given event
create index event_distances_event_id_idx
  on event_distances (event_id);

-- 2. Seed one row per existing event from the current distance_category column
insert into event_distances (event_id, distance_category, sort_order)
select id, distance_category, 0
from events;

-- 3. Add event_distance_id to participations (nullable — existing rows keep null)
alter table event_participations
  add column event_distance_id uuid references event_distances(id) on delete set null;

-- 4. Enable RLS on event_distances
--    Distances are public data (readable by anyone), writable only by admins
--    via the same has_role('admin') function used elsewhere.
alter table event_distances enable row level security;

create policy "Event distances are publicly readable"
  on event_distances
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert event distances"
  on event_distances
  for insert
  to authenticated
  with check (has_role('admin'));

create policy "Admins can update event distances"
  on event_distances
  for update
  to authenticated
  using (has_role('admin'))
  with check (has_role('admin'));

create policy "Admins can delete event distances"
  on event_distances
  for delete
  to authenticated
  using (has_role('admin'));

-- 5. Drop the now-redundant column from events
alter table events
  drop column distance_category;
