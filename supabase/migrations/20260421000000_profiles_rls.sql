-- RLS policies for profiles table
-- Each authenticated user may only read/update their own row.
-- The row is created automatically by a trigger on auth.users.

alter table profiles enable row level security;

-- Anyone can read public profiles (needed for future social features)
create policy "Public profiles are viewable by everyone"
  on profiles
  for select
  using (true);

-- Users can insert their own profile (needed if trigger doesn't exist)
create policy "Users can insert own profile"
  on profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
