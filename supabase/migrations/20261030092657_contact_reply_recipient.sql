-- Resolve only the current, verified account address for an admin reply.
-- Stored contact email is client-writable and is not a trusted destination.
create schema if not exists private;

create function private.get_contact_reply_recipient(message_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  recipient text;
begin
  if auth.uid() is null or not coalesce(public.has_role('admin'), false) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select case when u.email_confirmed_at is not null then u.email end
  into recipient
  from public.contact_messages m
  left join auth.users u on u.id = m.user_id
  where m.id = message_id;

  if not found then
    raise exception 'Contact message not found' using errcode = 'P0002';
  end if;
  return recipient;
end;
$$;

revoke all on function private.get_contact_reply_recipient(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.get_contact_reply_recipient(uuid) to authenticated;

create function public.get_contact_reply_recipient(message_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_contact_reply_recipient(message_id);
$$;

revoke all on function public.get_contact_reply_recipient(uuid) from public, anon;
grant execute on function public.get_contact_reply_recipient(uuid) to authenticated;
