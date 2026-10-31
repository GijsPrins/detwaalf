-- Remaining fixes from the October security review (PR #48), rebased on the
-- current schema.

-- Profiles and participations stay readable only through their scoped
-- policies and RPCs. Production already dropped these blanket policies by hand.
drop policy if exists "profiles: public read" on public.profiles;
drop policy if exists "participations: public read" on public.event_participations;

-- Links must be http(s) on every write path, including direct Data API writes.
create or replace function public.is_safe_http_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null or value = '' or (
    value ~* '^https?://[^/?#@[:space:]\\]+([/?#][^[:space:]\\]*)?$'
    and value !~ '[[:cntrl:]]'
  );
$$;

-- Links typed without a scheme ("uitslagen.nl/123") were meant as https.
-- Any other invalid link makes this migration fail instead of being dropped.
update public.events
set event_url = 'https://' || event_url
where not public.is_safe_http_url(event_url)
  and public.is_safe_http_url('https://' || event_url);
update public.events
set registration_url = 'https://' || registration_url
where not public.is_safe_http_url(registration_url)
  and public.is_safe_http_url('https://' || registration_url);
update public.event_participations
set timing_url = 'https://' || timing_url
where not public.is_safe_http_url(timing_url)
  and public.is_safe_http_url('https://' || timing_url);

alter table public.events
  add constraint events_event_url_http
    check (public.is_safe_http_url(event_url)),
  add constraint events_registration_url_http
    check (public.is_safe_http_url(registration_url));
alter table public.event_participations
  add constraint event_participations_timing_url_http
    check (public.is_safe_http_url(timing_url));

-- Role checks go through has_role(); clients cannot list who has which role.
revoke select on public.profile_roles from public, anon, authenticated;

-- Legacy helpers also need a fixed lookup path.
alter function public.get_medal(numeric) set search_path = public, pg_temp;
alter function public.update_updated_at() set search_path = public, pg_temp;

-- The sender email always comes from the account, also for direct Data API
-- inserts that bypass the Nuxt endpoint.
create schema if not exists private;

create or replace function private.set_contact_message_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Without a signed-in user this is a trusted server-side insert; anon has
  -- no insert grant. current_user cannot tell, it is the definer here.
  if auth.uid() is null then
    return new;
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'contact_message_requires_owner';
  end if;

  select email into new.email from auth.users where id = auth.uid();
  if new.email is null or new.email = '' then
    raise exception using errcode = '42501', message = 'contact_message_requires_email';
  end if;
  return new;
end;
$$;

revoke all on function private.set_contact_message_email()
  from public, anon, authenticated;

create trigger set_contact_message_email
  before insert on public.contact_messages
  for each row execute function private.set_contact_message_email();
