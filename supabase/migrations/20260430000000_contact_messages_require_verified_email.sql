-- Require email confirmation before a user can submit contact messages.
-- Supabase issues a valid JWT on sign-up before confirmation, so the previous
-- policy (auth.uid() = user_id) alone allowed unverified users to insert via
-- the API directly, bypassing the frontend middleware.
drop policy "Users can insert own messages" on contact_messages;

create policy "Users can insert own messages"
  on contact_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    AND (auth.jwt() ->> 'email_confirmed_at') IS NOT NULL
  );
