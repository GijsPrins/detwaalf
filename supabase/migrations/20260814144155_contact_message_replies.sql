create table contact_message_replies (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid not null references contact_messages(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

alter table contact_message_replies enable row level security;

grant select, insert on public.contact_message_replies to authenticated;

create index contact_message_replies_contact_message_id_created_at_idx
  on contact_message_replies (contact_message_id, created_at);

create policy "Users can read own messages"
  on contact_messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

alter policy "Admins can update messages"
  on contact_messages
  using (has_role('admin'))
  with check (has_role('admin'));

create policy "Admins can read message replies"
  on contact_message_replies for select
  to authenticated
  using (has_role('admin'));

create policy "Users can read replies to own messages"
  on contact_message_replies for select
  to authenticated
  using (
    exists (
      select 1
      from contact_messages
      where contact_messages.id = contact_message_replies.contact_message_id
        and contact_messages.user_id = (select auth.uid())
    )
  );

create policy "Admins can reply to messages"
  on contact_message_replies for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and has_role('admin')
  );
