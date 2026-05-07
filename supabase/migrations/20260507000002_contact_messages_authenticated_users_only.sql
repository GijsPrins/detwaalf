-- Contact messages should be writable by any signed-in user for their own row.
-- No extra role or email-verification gate is required here.
drop policy "Users can insert own messages" on contact_messages;

create policy "Users can insert own messages"
  on contact_messages for insert
  to authenticated
  with check (auth.uid() = user_id);