alter table contact_messages
  add column last_viewed_at timestamptz;

revoke update on public.contact_messages from authenticated;
grant update(read_at, last_viewed_at) on public.contact_messages to authenticated;

create policy "Users can mark own messages viewed"
  on contact_messages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
