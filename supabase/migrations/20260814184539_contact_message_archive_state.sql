alter table contact_messages
  add column user_archived_at timestamptz,
  add column admin_archived_at timestamptz;

revoke update on public.contact_messages from authenticated;
grant update(read_at, last_viewed_at, user_archived_at, admin_archived_at)
  on public.contact_messages to authenticated;

drop policy if exists "Admins can update messages" on contact_messages;
create policy "Admins can update messages"
  on contact_messages for update
  to authenticated
  using (has_role('admin'))
  with check (has_role('admin'));

drop policy if exists "Users can mark own messages viewed" on contact_messages;
create policy "Users can update own message view state"
  on contact_messages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and admin_archived_at is null
  );
