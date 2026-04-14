alter table event_distances
  add column label text;

update event_distances
set label = case distance_category
  when '10k' then '10 km'
  when 'half' then 'Halve marathon'
  when 'marathon' then 'Marathon'
end
where label is null;

alter table event_distances
  alter column label set not null;

alter table event_distances
  add constraint event_distances_label_not_blank
  check (char_length(btrim(label)) > 0);

drop index if exists event_distances_event_id_category_key;

create unique index event_distances_event_id_label_key
  on event_distances (event_id, lower(btrim(label)));