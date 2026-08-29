-- An admin reply makes the thread relevant to the user again and means the
-- original message has necessarily been handled by an administrator.

create or replace function public.sync_contact_message_reply_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.contact_messages
  set
    user_archived_at = null,
    read_at = statement_timestamp()
  where id = new.contact_message_id;

  return new;
end;
$$;

revoke all on function public.sync_contact_message_reply_state() from public;
revoke all on function public.sync_contact_message_reply_state()
  from anon, authenticated;

drop trigger if exists sync_contact_message_reply_state
  on public.contact_message_replies;

create trigger sync_contact_message_reply_state
  after insert on public.contact_message_replies
  for each row
  execute function public.sync_contact_message_reply_state();

-- Admin archive state is independent from the user's view/archive state. The
-- write guard trigger owns column-level separation, so RLS only needs to keep
-- the update on the user's own row.
drop policy if exists "Users can update own message view state"
  on public.contact_messages;

create policy "Users can update own message view state"
  on public.contact_messages
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
