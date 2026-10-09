import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const alice = "00000000-0000-0000-0000-000000000001";
const bob = "00000000-0000-0000-0000-000000000002";
const admin = "00000000-0000-0000-0000-000000000003";

test("security migration enforces access and input boundaries", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(await readFile(new URL("./security-baseline.sql", import.meta.url), "utf8"));
  const distanceMigration = await readFile(new URL("../../supabase/migrations/20260822090000_event_distance_meters.sql", import.meta.url), "utf8");
  await db.exec(distanceMigration.split("alter table public.event_distances")[0]);
  await db.exec(await readFile(new URL("../../supabase/migrations/20261009111345_security_review_hardening.sql", import.meta.url), "utf8"));

  async function asRole(role, userId, action) {
    await db.exec("begin");
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId ?? ""]);
      await db.exec(`set local role ${role}`);
      await action();
    } finally {
      await db.exec("rollback");
    }
  }

  await t.test("anon sees public profiles only and cannot read participations", async () => {
    await asRole("anon", null, async () => {
      assert.equal((await db.query("select * from public.profiles where not is_public")).rows.length, 0);
      assert.equal((await db.query("select * from public.profiles")).rows.length, 1);
      await assert.rejects(db.query("select * from public.event_participations"), { code: "42501" });
    });
  });

  await t.test("users see their own private profile and participation only", async () => {
    await asRole("authenticated", alice, async () => {
      assert.equal((await db.query("select * from public.profiles")).rows.length, 2);
      assert.deepEqual((await db.query("select user_id from public.event_participations")).rows, [{ user_id: alice }]);
      assert.equal((await db.query("update public.event_participations set notes='changed' where user_id=$1 returning id", [bob])).rows.length, 0);
      assert.equal((await db.query("update public.event_participations set notes='changed' where user_id=$1 returning id", [alice])).rows.length, 1);
      await assert.rejects(db.query("insert into public.event_participations(user_id) values ($1)", [bob]), { code: "42501" });
    });
  });

  await t.test("admin participation access remains available", async () => {
    await asRole("authenticated", admin, async () => {
      assert.equal((await db.query("select public.has_role('admin') as allowed")).rows[0].allowed, true);
      assert.equal((await db.query("select * from public.event_participations")).rows.length, 2);
    });
  });

  await t.test("role roster and internal RPCs are unavailable to unintended callers", async () => {
    await asRole("authenticated", alice, async () => {
      assert.equal((await db.query("select public.has_role('admin') as allowed")).rows[0].allowed, false);
      await assert.rejects(db.query("select * from public.profile_roles"), { code: "42501" });
    });
    for (const signature of ["public.has_role(text)", "public.generate_profile_slug(text)", "public.get_event_cancellation_signals()"] ) {
      assert.equal((await db.query("select has_function_privilege('anon',$1,'EXECUTE') as allowed", [signature])).rows[0].allowed, false);
    }
  });

  await t.test("direct event, registration and timing writes reject unsafe URLs", async () => {
    for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.test", "https://a.test\\evil", "https://a.test/\n", "https://user:pass@evil.test"]) {
      for (const field of ["event_url", "registration_url"]) {
        await assert.rejects(db.query(`insert into public.events(${field}) values ($1)`, [url]), { code: "23514" });
      }
      await assert.rejects(db.query("insert into public.event_participations(timing_url) values ($1)", [url]), { code: "23514" });
    }
    await db.query("insert into public.events(event_url, registration_url) values ($1, $2)", ["https://example.test/results?q=1#finish", "HTTP://example.test"]);
  });

  await t.test("event RPCs reject unsafe URLs before writing and allow normal URLs", async () => {
    const args = ["Test", "2027-01-01", 1, "Tilburg", "javascript:alert(1)", null, null, null, '[{"distance":"10k"}]'];
    await asRole("authenticated", alice, async () => {
      await assert.rejects(db.query("select public.create_event_with_distances($1,$2,$3,$4,$5,$6,$7,$8,$9)", args), { code: "22023" });
    });
    args[4] = "https://example.test";
    await asRole("authenticated", alice, async () => {
      const result = await db.query("select public.create_event_with_distances($1,$2,$3,$4,$5,$6,$7,$8,$9) as id", args);
      const id = result.rows[0].id;
      assert.equal((await db.query("select * from public.event_distances where event_id=$1", [id])).rows.length, 1);
      args[5] = "javascript:alert(1)";
      await assert.rejects(db.query("select public.update_event_with_distances($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [id, ...args]), { code: "22023" });
    });
  });

  await t.test("contact email is derived from the authenticated account", async () => {
    await asRole("authenticated", alice, async () => {
      const result = await db.query("insert into public.contact_messages(user_id,email,message) values ($1,'spoof@example.test','test') returning email", [alice]);
      assert.equal(result.rows[0].email, "alice@example.test");
    });
    await asRole("authenticated", alice, async () => {
      await assert.rejects(db.query("insert into public.contact_messages(user_id,email,message) values ($1,'spoof@example.test','test')", [bob]), { code: "42501" });
    });
  });
});
