-- Allow administrators to fully manage slug words while keeping public reads limited to active words.

create policy "Admins can read all slug words"
  on slug_word_list
  for select
  to authenticated
  using (has_role('admin'));

create policy "Admins can insert slug words"
  on slug_word_list
  for insert
  to authenticated
  with check (has_role('admin'));

create policy "Admins can update slug words"
  on slug_word_list
  for update
  to authenticated
  using (has_role('admin'))
  with check (has_role('admin'));

create policy "Admins can delete slug words"
  on slug_word_list
  for delete
  to authenticated
  using (has_role('admin'));
