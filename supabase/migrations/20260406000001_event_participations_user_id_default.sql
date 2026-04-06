-- Set user_id default to auth.uid() so the client never needs to send it.
-- This also prevents clients from inserting rows on behalf of other users.

alter table event_participations
  alter column user_id set default auth.uid();
