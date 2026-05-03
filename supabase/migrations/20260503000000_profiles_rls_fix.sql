-- Replace the open "viewable by everyone" SELECT policy with one that
-- enforces is_public, while still letting users view their own profile
-- (needed for the profile preview feature).
drop policy "Public profiles are viewable by everyone" on profiles;

create policy "Public profiles are viewable"
  on profiles
  for select
  using (is_public = true or id = auth.uid());
