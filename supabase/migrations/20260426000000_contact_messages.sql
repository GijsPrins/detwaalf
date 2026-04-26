create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  type text not null check (type in ('general', 'data_request', 'delete_account')),
  message text not null check (char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table contact_messages enable row level security;

-- Authenticated users can submit their own messages only
create policy "Users can insert own messages"
  on contact_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only admins can read messages
create policy "Admins can read messages"
  on contact_messages for select
  to authenticated
  using (has_role('admin'));

-- Only admins can mark messages as read
create policy "Admins can update messages"
  on contact_messages for update
  to authenticated
  using (has_role('admin'));
