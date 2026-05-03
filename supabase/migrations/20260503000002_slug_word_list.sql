create table slug_word_list (
  id     bigint generated always as identity primary key,
  locale text    not null,
  type   text    not null check (type in ('adjective', 'noun')),
  word   text    not null,
  active boolean not null default true,
  unique (locale, word)
);

alter table slug_word_list enable row level security;

create policy "Active words are readable by authenticated users"
  on slug_word_list
  for select
  to authenticated
  using (active = true);

-- SQL function that picks a random adjective + noun and returns a unique slug.
-- Retries up to 10 times; appends a 2-digit suffix after 5 failed attempts.
create or replace function generate_profile_slug(p_locale text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adj    text;
  v_noun   text;
  v_slug   text;
  v_attempt int := 0;
begin
  loop
    select word into v_adj
      from slug_word_list
      where locale = p_locale and type = 'adjective' and active = true
      order by random() limit 1;

    select word into v_noun
      from slug_word_list
      where locale = p_locale and type = 'noun' and active = true
      order by random() limit 1;

    if v_adj is null or v_noun is null then
      raise exception 'No active words available for locale "%"', p_locale;
    end if;

    v_slug := v_adj || '-' || v_noun;

    if v_attempt >= 5 then
      v_slug := v_slug || '-' || lpad((floor(random() * 90) + 10)::text, 2, '0');
    end if;

    if not exists (select 1 from profiles where slug = v_slug) then
      return v_slug;
    end if;

    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'Could not generate a unique slug after 10 attempts';
    end if;
  end loop;
end;
$$;

-- Initial Dutch word list seed
insert into slug_word_list (locale, type, word) values
  -- adjectives
  ('nl', 'adjective', 'snelle'),
  ('nl', 'adjective', 'koene'),
  ('nl', 'adjective', 'ijzeren'),
  ('nl', 'adjective', 'sterke'),
  ('nl', 'adjective', 'moedige'),
  ('nl', 'adjective', 'dappere'),
  ('nl', 'adjective', 'felle'),
  ('nl', 'adjective', 'stoere'),
  ('nl', 'adjective', 'vrije'),
  ('nl', 'adjective', 'wilde'),
  ('nl', 'adjective', 'stille'),
  ('nl', 'adjective', 'heldere'),
  ('nl', 'adjective', 'trotse'),
  ('nl', 'adjective', 'flinke'),
  ('nl', 'adjective', 'gouden'),
  ('nl', 'adjective', 'zilveren'),
  ('nl', 'adjective', 'harde'),
  ('nl', 'adjective', 'soepele'),
  ('nl', 'adjective', 'vurige'),
  ('nl', 'adjective', 'scherpe'),
  ('nl', 'adjective', 'lichte'),
  ('nl', 'adjective', 'donkere'),
  ('nl', 'adjective', 'hoge'),
  ('nl', 'adjective', 'vaste'),
  ('nl', 'adjective', 'wendbare'),
  ('nl', 'adjective', 'atletische'),
  ('nl', 'adjective', 'lenige'),
  ('nl', 'adjective', 'slanke'),
  ('nl', 'adjective', 'energieke'),
  ('nl', 'adjective', 'bruisende'),
  ('nl', 'adjective', 'gezwinde'),
  ('nl', 'adjective', 'gestaalde'),
  ('nl', 'adjective', 'vliegende'),
  ('nl', 'adjective', 'stormende'),
  ('nl', 'adjective', 'brandende'),
  ('nl', 'adjective', 'taaie'),
  ('nl', 'adjective', 'bedaarde'),
  ('nl', 'adjective', 'rustige'),
  ('nl', 'adjective', 'doelgerichte'),
  ('nl', 'adjective', 'heldhaftige'),
  ('nl', 'adjective', 'onverschrokken'),
  ('nl', 'adjective', 'vastberaden'),
  ('nl', 'adjective', 'gedurfde'),
  ('nl', 'adjective', 'vrolijke'),
  ('nl', 'adjective', 'springlevende'),
  -- nouns
  ('nl', 'noun', 'wolf'),
  ('nl', 'noun', 'eik'),
  ('nl', 'noun', 'loper'),
  ('nl', 'noun', 'held'),
  ('nl', 'noun', 'storm'),
  ('nl', 'noun', 'rivier'),
  ('nl', 'noun', 'berg'),
  ('nl', 'noun', 'valk'),
  ('nl', 'noun', 'arend'),
  ('nl', 'noun', 'stier'),
  ('nl', 'noun', 'reus'),
  ('nl', 'noun', 'beer'),
  ('nl', 'noun', 'tijger'),
  ('nl', 'noun', 'leeuw'),
  ('nl', 'noun', 'wind'),
  ('nl', 'noun', 'vlam'),
  ('nl', 'noun', 'rots'),
  ('nl', 'noun', 'bos'),
  ('nl', 'noun', 'ster'),
  ('nl', 'noun', 'sprint'),
  ('nl', 'noun', 'haas'),
  ('nl', 'noun', 'vos'),
  ('nl', 'noun', 'hert'),
  ('nl', 'noun', 'panter'),
  ('nl', 'noun', 'jager'),
  ('nl', 'noun', 'strijder'),
  ('nl', 'noun', 'ridder'),
  ('nl', 'noun', 'pionier'),
  ('nl', 'noun', 'kampioen'),
  ('nl', 'noun', 'atleet'),
  ('nl', 'noun', 'buffel'),
  ('nl', 'noun', 'ros'),
  ('nl', 'noun', 'draak'),
  ('nl', 'noun', 'feniks'),
  ('nl', 'noun', 'tornado'),
  ('nl', 'noun', 'komeet'),
  ('nl', 'noun', 'donder'),
  ('nl', 'noun', 'bliksem'),
  ('nl', 'noun', 'adelaar'),
  ('nl', 'noun', 'zeeman'),
  ('nl', 'noun', 'skipper'),
  ('nl', 'noun', 'sprinter'),
  ('nl', 'noun', 'marathonloper'),
  ('nl', 'noun', 'hardloper'),
  ('nl', 'noun', 'avonturier');
