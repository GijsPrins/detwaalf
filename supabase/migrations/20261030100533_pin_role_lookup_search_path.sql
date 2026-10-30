-- Keep the role check independent of the caller's search_path. The contact
-- recipient lookup deliberately runs with an empty path.
create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_roles as assigned_role
    where assigned_role.profile_id = auth.uid()
      and assigned_role.role = role_name
  );
$$;
