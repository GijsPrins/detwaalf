-- Fix is_public to default to false so new users start with a private profile.
-- Also resets profiles that were never explicitly made public (identified by
-- the absence of a slug, which is only generated when the user enables the toggle).
alter table profiles alter column is_public set default false;

update profiles
set is_public = false
where is_public = true
  and slug is null;
