-- Quarter marathons (10.55 km) are common and count toward the 10k track.
-- A new enum value cannot be used in the transaction that adds it, so the
-- length mapping is updated in the next migration.

alter type public.event_distance add value if not exists 'quarter_marathon' after '10k';
