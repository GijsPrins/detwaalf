-- Configure the recipient separately per environment; never commit account IDs.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.event_ownership_settings (
  singleton boolean primary key default true check (singleton),
  fallback_profile_id uuid not null references public.profiles(id) on delete restrict
);

alter table private.event_ownership_settings enable row level security;
revoke all on private.event_ownership_settings
  from public, anon, authenticated, service_role;

create function private.transfer_events_before_profile_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
begin
  -- Only profile deletion may invoke this privileged transfer. Auth deletion
  -- reaches this trigger through the profiles -> auth.users cascade.
  if tg_table_schema <> 'public' or tg_table_name <> 'profiles'
     or tg_op <> 'DELETE' or tg_when <> 'BEFORE' then
    raise exception 'Event ownership transfer requires profile deletion';
  end if;

  select fallback_profile_id into recipient_id
  from private.event_ownership_settings
  where singleton
  for share;

  if recipient_id = old.id then
    raise exception 'Configure another event owner before deleting the fallback account';
  end if;

  if not exists (select 1 from public.events where created_by = old.id) then
    return old;
  end if;

  if recipient_id is null then
    raise exception 'Configure an event owner before deleting an event creator';
  end if;

  update public.events
  set created_by = recipient_id
  where created_by = old.id;

  return old;
end;
$$;

revoke all on function private.transfer_events_before_profile_deletion()
  from public, anon, authenticated, service_role;

create trigger transfer_events_before_profile_deletion
  before delete on public.profiles
  for each row
  execute function private.transfer_events_before_profile_deletion();
