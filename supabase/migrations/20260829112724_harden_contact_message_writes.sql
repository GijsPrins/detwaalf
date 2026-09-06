-- Keep contact-message state transitions role-specific and rate-limit inserts
-- at the database boundary, including clients that bypass the Nuxt endpoint.

revoke insert on public.contact_messages from authenticated;
grant insert(user_id, email, type, message)
  on public.contact_messages to authenticated;

revoke update on public.contact_messages from authenticated;
grant update(read_at, last_viewed_at, user_archived_at, admin_archived_at)
  on public.contact_messages to authenticated;

create index if not exists contact_messages_user_id_created_at_idx
  on public.contact_messages (user_id, created_at desc);

create or replace function public.enforce_contact_message_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  short_window_count integer;
  daily_window_count integer;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(
      hashtextextended(new.user_id::text, 0)
    );

    select
      count(*) filter (
        where created_at >= statement_timestamp() - interval '10 minutes'
      ),
      count(*)
    into short_window_count, daily_window_count
    from public.contact_messages
    where user_id = new.user_id
      and created_at >= statement_timestamp() - interval '24 hours';

    if short_window_count >= 3 or daily_window_count >= 10 then
      raise exception using
        errcode = 'P0001',
        message = 'contact_message_rate_limit';
    end if;

    return new;
  end if;

  if row(new.user_id, new.email, new.type, new.message, new.created_at)
      is distinct from
     row(old.user_id, old.email, old.type, old.message, old.created_at) then
    raise exception using
      errcode = '42501',
      message = 'contact_message_content_is_immutable';
  end if;

  if public.has_role('admin') then
    if row(new.last_viewed_at, new.user_archived_at)
        is distinct from
       row(old.last_viewed_at, old.user_archived_at) then
      raise exception using
        errcode = '42501',
        message = 'admin_cannot_change_user_message_state';
    end if;
  elsif row(new.read_at, new.admin_archived_at)
      is distinct from
     row(old.read_at, old.admin_archived_at) then
    raise exception using
      errcode = '42501',
      message = 'user_cannot_change_admin_message_state';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_contact_message_write() from public;

drop trigger if exists enforce_contact_message_write
  on public.contact_messages;

create trigger enforce_contact_message_write
  before insert or update on public.contact_messages
  for each row
  execute function public.enforce_contact_message_write();
