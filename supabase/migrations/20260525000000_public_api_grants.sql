-- Explicit Data API privileges for Supabase client roles.
-- RLS policies still decide which rows anon/authenticated users may access.

grant usage on schema public to anon, authenticated;

grant select on public.provinces to anon, authenticated;
grant select on public.medal_thresholds to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.event_distances to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.event_participations to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_distances to authenticated;
grant insert on public.contact_messages to authenticated;
grant select, update on public.contact_messages to authenticated;
grant select, insert, update, delete on public.slug_word_list to authenticated;
grant select on public.app_roles to authenticated;
grant select on public.profile_roles to authenticated;

grant usage, select on all sequences in schema public to authenticated;

do $$
begin
  if to_regprocedure('public.has_role(text)') is not null then
    grant execute on function public.has_role(text) to authenticated;
  end if;

  if to_regprocedure('public.create_event_with_distances(text,date,integer,text,text,text,date,date,jsonb)') is not null then
    grant execute on function public.create_event_with_distances(
      text,
      date,
      integer,
      text,
      text,
      text,
      date,
      date,
      jsonb
    ) to authenticated;
  end if;

  if to_regprocedure('public.update_event_with_distances(uuid,text,date,integer,text,text,text,date,date,jsonb)') is not null then
    grant execute on function public.update_event_with_distances(
      uuid,
      text,
      date,
      integer,
      text,
      text,
      text,
      date,
      date,
      jsonb
    ) to authenticated;
  end if;

  if to_regprocedure('public.generate_profile_slug(text)') is not null then
    grant execute on function public.generate_profile_slug(text) to authenticated;
  end if;

  if to_regprocedure('public.get_public_profile_participations(uuid)') is not null then
    grant execute on function public.get_public_profile_participations(uuid) to anon, authenticated;
  end if;
end $$;
