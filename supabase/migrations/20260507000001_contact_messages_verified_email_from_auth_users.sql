-- Read verification state from auth.users instead of JWT claims.
-- In this project, the client can observe a confirmed user while the JWT used
-- by PostgREST does not expose the confirmation timestamp claims needed by the
-- previous policy.
drop policy "Users can insert own messages" on contact_messages;

create policy "Users can insert own messages"
  on contact_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    AND exists (
      select 1
      from auth.users
      where auth.users.id = auth.uid()
        and auth.users.email_confirmed_at is not null
    )
  );