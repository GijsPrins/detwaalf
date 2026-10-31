import { after, afterEach, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const recipient = '00000000-0000-4000-8000-000000000001';
const creator = '00000000-0000-4000-8000-000000000002';
const participant = '00000000-0000-4000-8000-000000000003';
let db;

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create role supabase_auth_admin;
    create schema auth;
    create table auth.users (id uuid primary key);
    grant usage on schema auth to supabase_auth_admin;
    grant select, delete on auth.users to supabase_auth_admin;
    create table public.profiles (
      id uuid primary key references auth.users(id) on delete cascade
    );
    create table public.events (
      id integer primary key,
      created_by uuid not null references public.profiles(id)
    );
    alter table public.events enable row level security;
    create table public.event_distances (
      id integer primary key,
      event_id integer references public.events(id) on delete cascade
    );
    create table public.event_participations (
      event_id integer references public.events(id) on delete cascade,
      user_id uuid references public.profiles(id) on delete cascade
    );
  `);
  await db.exec(await readFile(new URL(
    '../../supabase/migrations/20261029082138_transfer_events_before_profile_deletion.sql',
    import.meta.url,
  ), 'utf8'));
});

beforeEach(async () => {
  await db.exec('begin');
  for (const id of [recipient, creator, participant]) {
    await db.query('insert into auth.users values ($1)', [id]);
    await db.query('insert into public.profiles values ($1)', [id]);
  }
});

afterEach(async () => { await db.exec('rollback'); });
after(async () => { await db.close(); });

async function configureRecipient() {
  await db.query('insert into private.event_ownership_settings (fallback_profile_id) values ($1)', [recipient]);
}

async function createEvent() {
  await db.query('insert into public.events values (1, $1)', [creator]);
  await db.exec('insert into public.event_distances values (1, 1)');
  for (const id of [creator, participant]) {
    await db.query('insert into public.event_participations values (1, $1)', [id]);
  }
}

test('Auth deletion transfers events despite event RLS and preserves other participations', async () => {
  await configureRecipient();
  await createEvent();
  await db.query('insert into public.events values (2, $1)', [participant]);
  await db.exec('set local role supabase_auth_admin');
  // The Auth service has no direct event UPDATE permission.
  await db.query('delete from auth.users where id = $1', [creator]);
  await db.exec('reset role');
  assert.deepEqual((await db.query('select * from public.events order by id')).rows, [
    { id: 1, created_by: recipient }, { id: 2, created_by: participant },
  ]);
  assert.equal((await db.query('select * from public.event_distances')).rows.length, 1);
  assert.deepEqual((await db.query('select * from public.event_participations')).rows,
    [{ event_id: 1, user_id: participant }]);
  assert.equal((await db.query('select * from public.profiles where id = $1', [creator])).rows.length, 0);
});

test('direct profile deletion also transfers events', async () => {
  await configureRecipient();
  await createEvent();
  await db.query('delete from public.profiles where id = $1', [creator]);
  assert.equal((await db.query('select created_by from public.events')).rows[0].created_by, recipient);
});

test('missing configuration blocks deletion atomically', async () => {
  await createEvent();
  await db.exec('savepoint deletion');
  await assert.rejects(db.query('delete from auth.users where id = $1', [creator]), /Configure an event owner/);
  await db.exec('rollback to deletion');
  assert.equal((await db.query('select id from auth.users where id = $1', [creator])).rows.length, 1);
  assert.equal((await db.query('select created_by from public.events')).rows[0].created_by, creator);
  assert.equal((await db.query('select * from public.event_participations')).rows.length, 2);
});

test('users without events can be deleted without configuration', async () => {
  await db.query('delete from auth.users where id = $1', [creator]);
  assert.equal((await db.query('select id from public.profiles where id = $1', [creator])).rows.length, 0);
});

test('fallback account cannot be deleted, even without events', async () => {
  await configureRecipient();
  await assert.rejects(db.query('delete from auth.users where id = $1', [recipient]), /Configure another event owner/);
});

test('configuration requires an existing profile', async () => {
  await assert.rejects(db.query(
    'insert into private.event_ownership_settings (fallback_profile_id) values ($1)',
    ['00000000-0000-4000-8000-000000000099'],
  ), /foreign key/);
});

test('recipient can be changed before deleting the previous fallback account', async () => {
  await configureRecipient();
  await db.query('insert into public.events values (1, $1)', [recipient]);
  await db.query('update private.event_ownership_settings set fallback_profile_id = $1', [participant]);
  await db.query('delete from auth.users where id = $1', [recipient]);
  assert.equal((await db.query('select created_by from public.events')).rows[0].created_by, participant);
});

test('bulk deletion including the recipient rolls back all transfers', async () => {
  await configureRecipient();
  await createEvent();
  await db.exec('savepoint deletion');
  await assert.rejects(db.query('delete from auth.users where id in ($1, $2)', [creator, recipient]), /Configure another event owner/);
  await db.exec('rollback to deletion');
  assert.equal((await db.query('select count(*)::int as total from auth.users')).rows[0].total, 3);
  assert.equal((await db.query('select created_by from public.events')).rows[0].created_by, creator);
});

test('client roles cannot change settings or call the privileged trigger function', async () => {
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const { rows } = await db.query(`select
      has_table_privilege($1, 'private.event_ownership_settings', 'INSERT') as can_insert,
      has_table_privilege($1, 'private.event_ownership_settings', 'UPDATE') as can_update,
      has_table_privilege($1, 'private.event_ownership_settings', 'DELETE') as can_delete,
      has_function_privilege($1, 'private.transfer_events_before_profile_deletion()', 'EXECUTE') as can_execute`, [role]);
    assert.deepEqual(rows[0], { can_insert: false, can_update: false, can_delete: false, can_execute: false });
  }
  await db.exec('set local role authenticated');
  await assert.rejects(db.query('delete from public.profiles where id = $1', [creator]), /permission denied/);
});
