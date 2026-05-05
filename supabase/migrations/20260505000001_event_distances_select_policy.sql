-- event_distances were made publicly readable before RLS was enabled on the table.
-- The previous migration added write policies but omitted the SELECT policy,
-- making distances invisible to all clients. Restore public read access.

drop policy if exists "Event distances are publicly readable" on public.event_distances;

create policy "Event distances are publicly readable"
  on public.event_distances
  for select
  to anon, authenticated
  using (true);
