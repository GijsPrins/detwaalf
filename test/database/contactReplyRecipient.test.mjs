import { after, afterEach, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const sender = '00000000-0000-4000-8000-000000000002';
const message = '00000000-0000-4000-8000-000000000003';
let db;

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create table public.contact_messages (id uuid primary key, user_id uuid, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated;
    create table public.profile_roles (profile_id uuid, role text);
    create function public.has_role(role_name text) returns boolean
    language sql stable security definer as $$
      select exists (
        select 1 from profile_roles
        where profile_id = auth.uid() and role = role_name
      )
    $$;
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261030092657_contact_reply_recipient.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../supabase/migrations/20261030100533_pin_role_lookup_search_path.sql', import.meta.url), 'utf8'));
});

beforeEach(async () => {
  await db.exec('begin');
  await db.query("insert into public.profile_roles values ($1, 'admin')", [admin]);
  await db.query("insert into auth.users values ($1, 'current@example.test', now())", [sender]);
  await db.query("insert into public.contact_messages values ($1, $2, 'spoofed@example.test')", [message, sender]);
});
afterEach(async () => { await db.exec('rollback'); });
after(async () => { await db.close(); });

async function actAs(id) {
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  await db.exec('set local role authenticated');
}

test('admin receives the verified Auth address, never the stored client-supplied address', async () => {
  await actAs(admin);
  const { rows } = await db.query('select public.get_contact_reply_recipient($1) as email', [message]);
  assert.deepEqual(rows, [{ email: 'current@example.test' }]);
});

test('ordinary users cannot resolve recipient addresses even for their own messages', async () => {
  await actAs(sender);
  await assert.rejects(db.query('select public.get_contact_reply_recipient($1)', [message]), /Not authorized/);
});

test('anonymous clients cannot execute either function', async () => {
  for (const schema of ['public', 'private']) {
    const { rows } = await db.query(`select has_function_privilege('anon', '${schema}.get_contact_reply_recipient(uuid)', 'EXECUTE') as allowed`);
    assert.equal(rows[0].allowed, false);
  }
});

test('an authenticated role without an auth identity is denied', async () => {
  await actAs('');
  await assert.rejects(db.query('select public.get_contact_reply_recipient($1)', [message]), /Not authorized/);
});

test('deleted senders do not fall back to the stored email', async () => {
  await db.query('delete from auth.users where id = $1', [sender]);
  await db.query('update public.contact_messages set user_id = null where id = $1', [message]);
  await actAs(admin);
  assert.deepEqual((await db.query('select public.get_contact_reply_recipient($1) as email', [message])).rows, [{ email: null }]);
});

test('unverified email addresses are skipped', async () => {
  await db.exec('update auth.users set email_confirmed_at = null');
  await actAs(admin);
  assert.deepEqual((await db.query('select public.get_contact_reply_recipient($1) as email', [message])).rows, [{ email: null }]);
});

test('unknown messages fail instead of returning an arbitrary recipient', async () => {
  await actAs(admin);
  await assert.rejects(db.query('select public.get_contact_reply_recipient($1)', [sender]), /Contact message not found/);
});
test('role lookup works when its caller has an empty search_path', async () => {
  await actAs(admin);
  await db.exec("set local search_path = ''");
  assert.deepEqual((await db.query("select public.has_role('admin') as allowed")).rows, [{ allowed: true }]);
  assert.deepEqual((await db.query('select public.get_contact_reply_recipient($1) as email', [message])).rows, [{ email: 'current@example.test' }]);
});

test('caller-controlled search_path cannot supply fake admin role assignments', async () => {
  await db.exec('create schema attacker; create table attacker.profile_roles (profile_id uuid, role text)');
  await db.query("insert into attacker.profile_roles values ($1, 'admin')", [sender]);
  await db.exec('grant usage on schema attacker to authenticated');
  await actAs(sender);
  await db.exec('set local search_path = attacker');
  assert.deepEqual((await db.query("select public.has_role('admin') as allowed")).rows, [{ allowed: false }]);
  await assert.rejects(db.query('select public.get_contact_reply_recipient($1)', [message]), /Not authorized/);
});
