-- PostgreSQL grants function execution to PUBLIC by default. Keep the public
-- API of privileged helper functions explicit.

revoke all on function public.generate_profile_slug(text) from public;
grant execute on function public.generate_profile_slug(text) to authenticated;

revoke all on function public.get_public_profile_participations(uuid) from public;
grant execute on function public.get_public_profile_participations(uuid)
  to anon, authenticated;

revoke all on function public.get_event_cancellation_signals() from public;
grant execute on function public.get_event_cancellation_signals()
  to authenticated;

do $$
begin
  if to_regprocedure('public.has_role(text)') is not null then
    execute 'revoke all on function public.has_role(text) from public';
    execute 'grant execute on function public.has_role(text) to authenticated';
  end if;
end
$$;
