-- Support both Supabase email-confirmation claims when inserting contact messages.
-- Some projects expose `confirmed_at` while others expose `email_confirmed_at`
-- in the JWT. The app already accepts either, so the RLS policy must match.
drop policy "Users can insert own messages" on contact_messages;

create policy "Users can insert own messages"
  on contact_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    AND (
      (auth.jwt() ->> 'confirmed_at') IS NOT NULL
      OR (auth.jwt() ->> 'email_confirmed_at') IS NOT NULL
    )
  );