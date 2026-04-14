create type event_distance as enum (
  '10k',
  '15k',
  '10_miles',
  'half_marathon',
  '30k',
  'marathon'
);

drop index if exists event_distances_event_id_label_key;

alter table event_distances
  drop constraint if exists event_distances_label_not_blank;

alter table event_distances
  rename column label to distance;

alter table event_distances
  alter column distance type event_distance
  using (
    case
      when lower(replace(btrim(distance), ' ', '')) in ('10km', '10k') then '10k'::event_distance
      when lower(replace(btrim(distance), ' ', '')) in ('15km', '15k') then '15k'::event_distance
      when lower(replace(btrim(distance), ' ', '')) in ('10miles', '10mile', '10mijl', '10mijlen') then '10_miles'::event_distance
      when lower(replace(btrim(distance), ' ', '')) in ('halvemarathon', 'halfmarathon') then 'half_marathon'::event_distance
      when lower(replace(btrim(distance), ' ', '')) in ('30km', '30k') then '30k'::event_distance
      when lower(replace(btrim(distance), ' ', '')) = 'marathon' then 'marathon'::event_distance
      else null
    end
  );

create unique index event_distances_event_id_distance_key
  on event_distances (event_id, distance);