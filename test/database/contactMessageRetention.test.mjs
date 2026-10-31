import { after, afterEach, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const sender = '00000000-0000-4000-8000-000000000001';
const admin = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
const messageId = '00000000-0000-4000-8000-000000000004';
let db;

async function applyMigration(name) {
  await db.exec(await readFile(new URL(`../../supabase/migrations/${name}.sql`, import.meta.url), 'utf8'));
}

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create role supabase_auth_admin;
    create schema auth;
    create table auth.users (id uuid primary key);
    grant usage on schema auth to authenticated, supabase_auth_admin;
    grant select, delete on auth.users to supabase_auth_admin;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function public.has_role(role_name text) returns boolean language sql stable as $$
      select role_name = 'admin' and auth.uid() = '${admin}'::uuid
    $$;
  `);
  await applyMigration('20260426000000_contact_messages');
  await db.exec('grant select, insert, update on public.contact_messages to authenticated');
  await applyMigration('20260814144155_contact_message_replies');
  await applyMigration('20260814151429_contact_message_view_state');
  await applyMigration('20260814184539_contact_message_archive_state');
  await applyMigration('20260829112724_harden_contact_message_writes');
  await applyMigration('20260829135339_sync_contact_message_reply_state');
  await applyMigration('20261029082958_retain_contact_messages_after_user_deletion');
});

beforeEach(async () => {
  await db.exec('begin');
  for (const id of [sender, admin, other]) {
    await db.query('insert into auth.users values ($1)', [id]);
  }
  await db.query(`insert into public.contact_messages (id, user_id, email, type, message)
    values ($1, $2, 'sender@example.test', 'delete_account', 'Please remove my account')`, [messageId, sender]);
  await db.query(`insert into public.contact_message_replies (contact_message_id, author_id, body)
    values ($1, $2, 'Request received')`, [messageId, admin]);
});

afterEach(async () => { await db.exec('rollback'); });
after(async () => { await db.close(); });

async function deleteUser(id) {
  await db.exec('set local role supabase_auth_admin');
  await db.query('delete from auth.users where id = $1', [id]);
  await db.exec('reset role');
}

async function actAs(id) {
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  await db.exec('set local role authenticated');
}

test('Auth deletion retains the message and replies while removing sender identity', async () => {
  await db.query('update public.contact_messages set admin_archived_at = now() where id = $1', [messageId]);
  const original = (await db.query('select * from public.contact_messages')).rows[0];
  await deleteUser(sender);
  const message = (await db.query('select * from public.contact_messages')).rows[0];
  assert.deepEqual(message, { ...original, user_id: null, email: '<verwijderde gebruiker>' });
  assert.equal((await db.query('select body from public.contact_message_replies')).rows[0].body, 'Request received');
  assert.equal((await db.query('select * from auth.users where id = $1', [sender])).rows.length, 0);
});

test('deleted administrators replies retain their body but lose the author reference', async () => {
  await deleteUser(admin);
  assert.deepEqual((await db.query('select author_id, body from public.contact_message_replies')).rows,
    [{ author_id: null, body: 'Request received' }]);
  assert.equal((await db.query('select user_id from public.contact_messages')).rows[0].user_id, sender);
});

test('other users messages are unaffected', async () => {
  await deleteUser(other);
  const { rows } = await db.query('select user_id, email from public.contact_messages');
  assert.deepEqual(rows, [{ user_id: sender, email: 'sender@example.test' }]);
});

test('RLS allows admins to read detached threads and replies', async () => {
  await deleteUser(sender);
  await actAs(admin);
  assert.equal((await db.query('select * from public.contact_messages')).rows.length, 1);
  assert.equal((await db.query('select * from public.contact_message_replies')).rows.length, 1);
  await db.query('update public.contact_messages set admin_archived_at = now() where id = $1', [messageId]);
});

test('RLS hides detached messages and replies from other users and stale sender tokens', async () => {
  await deleteUser(sender);
  for (const id of [other, sender]) {
    await actAs(id);
    assert.equal((await db.query('select * from public.contact_messages')).rows.length, 0);
    assert.equal((await db.query('select * from public.contact_message_replies')).rows.length, 0);
    await db.exec('reset role');
  }
});

test('detached messages cannot retain a raw email address', async () => {
  await assert.rejects(db.query('update public.contact_messages set user_id = null where id = $1', [messageId]),
    /contact_messages_deleted_sender_email/);
});

test('authenticated senders cannot detach themselves or edit their stored email', async () => {
  await actAs(sender);
  await assert.rejects(db.query("update public.contact_messages set user_id = null, email = '<verwijderde gebruiker>' where id = $1", [messageId]),
    /permission denied/);
});

test('clients cannot invoke the privileged deletion trigger function', async () => {
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const { rows } = await db.query("select has_function_privilege($1, 'private.detach_contact_messages_before_user_deletion()', 'EXECUTE') as allowed", [role]);
    assert.equal(rows[0].allowed, false);
  }
});

test('rollback restores identity and account when a later deletion trigger fails', async () => {
  await db.exec(`
    create function public.block_test_deletion() returns trigger language plpgsql as $$
    begin raise exception 'test_deletion_blocked'; end;
    $$;
    create trigger z_block_test_deletion before delete on auth.users
    for each row execute function public.block_test_deletion();
    savepoint deletion;
  `);
  await assert.rejects(db.query('delete from auth.users where id = $1', [sender]), /test_deletion_blocked/);
  await db.exec('rollback to deletion');
  assert.equal((await db.query('select user_id from public.contact_messages')).rows[0].user_id, sender);
  assert.equal((await db.query('select email from public.contact_messages')).rows[0].email, 'sender@example.test');
  assert.equal((await db.query('select * from auth.users where id = $1', [sender])).rows.length, 1);
});
