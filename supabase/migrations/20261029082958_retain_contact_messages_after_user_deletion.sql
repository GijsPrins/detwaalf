-- Retain support threads while removing the deleted account's sender identity.
alter table public.contact_messages
  alter column user_id drop not null,
  drop constraint contact_messages_user_id_fkey,
  add constraint contact_messages_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null,
  add constraint contact_messages_deleted_sender_email
    check (user_id is not null or email = '<verwijderde gebruiker>');

-- Replies written by a deleted administrator must also remain in the thread.
alter table public.contact_message_replies
  alter column author_id drop not null,
  drop constraint contact_message_replies_author_id_fkey,
  add constraint contact_message_replies_author_id_fkey
    foreign key (author_id) references auth.users(id) on delete set null;

create schema if not exists private;

create function private.detach_contact_messages_before_user_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The Auth service can delete users without having permission to modify
  -- message content. This trigger only detaches the account being deleted.
  if tg_table_schema <> 'auth' or tg_table_name <> 'users'
     or tg_op <> 'DELETE' or tg_when <> 'BEFORE' then
    raise exception 'Contact message detachment requires Auth user deletion';
  end if;

  update public.contact_messages
  set user_id = null, email = '<verwijderde gebruiker>'
  where user_id = old.id;

  return old;
end;
$$;

revoke all on function private.detach_contact_messages_before_user_deletion()
  from public, anon, authenticated, service_role;

create trigger detach_contact_messages_before_user_deletion
  before delete on auth.users
  for each row
  execute function private.detach_contact_messages_before_user_deletion();
