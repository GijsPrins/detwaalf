import { after, afterEach, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const runner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const eventId = '00000000-0000-4000-8000-000000000003';
let db;

async function applyMigration(name) {
  await db.exec(await readFile(new URL(`../../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
}

// A minimal stand-in for the tables and helpers the migration touches, with
// the blanket read policies that still existed on staging.
async function createBaseline() {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;

    create table public.profiles (id uuid primary key, is_public boolean not null default false);
    alter table public.profiles enable row level security;
    create policy "profiles: public read" on public.profiles for select using (true);
    create policy "Public profiles are viewable" on public.profiles
      for select using (is_public = true or id = auth.uid());

    create table public.events (
      id uuid primary key,
      event_url text,
      registration_url text
    );
    create table public.event_participations (
      id uuid primary key default gen_random_uuid(),
      event_id uuid not null references public.events(id),
      user_id uuid not null,
      timing_url text
    );
    alter table public.event_participations enable row level security;
    create policy "participations: public read" on public.event_participations
      for select using (true);
    create policy "Users can view own participations" on public.event_participations
      for select to authenticated using (user_id = auth.uid());
    create policy "Users can update own participations" on public.event_participations
      for update to authenticated using (user_id = auth.uid());

    create table public.profile_roles (profile_id uuid not null, role text not null);

    create table public.contact_messages (
      id uuid primary key default gen_random_uuid(),
      user_id uuid,
      email text not null,
      message text not null
    );

    create function public.get_medal(value numeric) returns text language sql as $$ select 'gold' $$;
    create function public.update_updated_at() returns trigger language plpgsql as $$
      begin return new; end;
    $$;

    grant select on public.profiles, public.event_participations, public.profile_roles to authenticated;
    grant insert, update on public.events, public.event_participations to authenticated;
    grant insert on public.contact_messages to authenticated;
  `);
  await db.query(`insert into auth.users values ($1, 'runner@example.test'), ($2, 'other@example.test')`, [runner, other]);
  await db.query('insert into public.profiles values ($1, false), ($2, false)', [runner, other]);
  await db.query(`insert into public.events values ($1, 'voorbeeldloop.nl', 'https://inschrijven.nl/x')`, [eventId]);
  await db.query(`insert into public.event_participations (event_id, user_id, timing_url)
    values ($1, $2, 'uitslagen.nl/123'), ($1, $3, null)`, [eventId, runner, other]);
}

before(async () => {
  db = new PGlite();
  await createBaseline();
  await applyMigration('20261031160000_security_review_followup');
});

beforeEach(async () => { await db.exec('begin'); });
afterEach(async () => { await db.exec('rollback'); });
after(async () => { await db.close(); });

async function actAs(id) {
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  await db.exec('set local role authenticated');
}

async function rejects(sql, params, pattern) {
  await db.exec('savepoint attempt');
  await assert.rejects(db.query(sql, params), pattern);
  await db.exec('rollback to savepoint attempt');
}

test('links stored without a scheme become https links', async () => {
  const event = (await db.query('select event_url from public.events')).rows[0];
  assert.equal(event.event_url, 'https://voorbeeldloop.nl');
  const timing = (await db.query('select timing_url from public.event_participations where user_id = $1', [runner])).rows[0];
  assert.equal(timing.timing_url, 'https://uitslagen.nl/123');
});

test('unsafe links are rejected on every write path', async () => {
  await actAs(runner);
  for (const url of ['javascript:alert(1)', 'https://user:pw@example.org', 'https://example.org/a b']) {
    await rejects('update public.events set registration_url = $1', [url], /events_registration_url_http/);
    await rejects('update public.event_participations set timing_url = $1 where user_id = $2', [url, runner], /event_participations_timing_url_http/);
  }
  await db.query("update public.events set event_url = 'https://www.voorbeeldloop.nl/2027?a=1#info'");
});

test('signed-in users only read their own participations and public or own profiles', async () => {
  await actAs(runner);
  const participations = (await db.query('select user_id from public.event_participations')).rows;
  assert.deepEqual(participations.map((row) => row.user_id), [runner]);
  const profiles = (await db.query('select id from public.profiles')).rows;
  assert.deepEqual(profiles.map((row) => row.id), [runner]);
});

test('signed-in users cannot read the role roster', async () => {
  await actAs(runner);
  await rejects('select * from public.profile_roles', [], /permission denied/);
});

test('the contact sender email always comes from the account', async () => {
  await actAs(runner);
  await db.query(`insert into public.contact_messages (user_id, email, message)
    values ($1, 'spoofed@example.test', 'Hallo')`, [runner]);
  await db.exec('reset role');
  const message = (await db.query('select email from public.contact_messages')).rows[0];
  assert.equal(message.email, 'runner@example.test');
});

test('users cannot send contact messages for someone else', async () => {
  await actAs(runner);
  await rejects(`insert into public.contact_messages (user_id, email, message)
    values ($1, 'other@example.test', 'Hallo')`, [other], /contact_message_requires_owner/);
});

test('server-side inserts without a signed-in user keep their email', async () => {
  await db.query(`insert into public.contact_messages (user_id, email, message)
    values (null, 'server@example.test', 'Systeembericht')`);
  const message = (await db.query('select email from public.contact_messages')).rows[0];
  assert.equal(message.email, 'server@example.test');
});

test('legacy helpers have a fixed search path', async () => {
  const configs = (await db.query(`select proname, proconfig from pg_proc
    where proname in ('get_medal', 'update_updated_at') order by proname`)).rows;
  assert.deepEqual(configs.map((row) => row.proconfig), [
    ['search_path=public, pg_temp'],
    ['search_path=public, pg_temp'],
  ]);
});
