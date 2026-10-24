import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import {
  archiveContactMessage,
  archiveOwnContactMessage,
  fetchContactMessages,
  fetchOwnContactMessages,
  fetchOwnContactMessagesCount,
  fetchUnreadOwnContactRepliesCount,
  fetchUnreadContactMessagesCount,
  insertContactMessage,
  insertContactMessageReply,
  markOwnContactMessagesViewed,
  markMessageRead,
} from "~/queries/contactMessages";

describe("contactMessages queries", () => {
  it("fetchContactMessages returns rows with replies ordered by created_at desc", async () => {
    const rows = [{ id: "1" }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const is = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ is }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchContactMessages(supabase)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("contact_messages");
    expect(select).toHaveBeenCalledWith("*, contact_message_replies(*)");
    expect(is).toHaveBeenCalledWith("admin_archived_at", null);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("fetchOwnContactMessages excludes user-archived threads", async () => {
    const rows = [{ id: "1", contact_message_replies: [] }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const is = vi.fn(() => ({ order }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ is, eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchOwnContactMessages(supabase, "user-1")).resolves.toEqual(
      rows,
    );
    expect(from).toHaveBeenCalledWith("contact_messages");
    expect(select).toHaveBeenCalledWith("*, contact_message_replies(*)");
    expect(is).toHaveBeenCalledWith("user_archived_at", null);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("fetchUnreadContactMessagesCount returns zero when count is null", async () => {
    const isRead = vi.fn().mockResolvedValue({ count: null, error: null });
    const isArchived = vi.fn(() => ({ is: isRead }));
    const select = vi.fn(() => ({ is: isArchived }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchUnreadContactMessagesCount(supabase)).resolves.toBe(0);
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(isArchived).toHaveBeenCalledWith("admin_archived_at", null);
    expect(isRead).toHaveBeenCalledWith("read_at", null);
  });

  it("insertContactMessage maps payload fields correctly", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const supabase = { from } as never;

    await expect(
      insertContactMessage(supabase, {
        userId: "user-1",
        email: "user@example.com",
        type: "general",
        message: "Hello",
      }),
    ).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      email: "user@example.com",
      type: "general",
      message: "Hello",
    });
  });

  it("fetchOwnContactMessagesCount returns exact count", async () => {
    const is = vi.fn().mockResolvedValue({ count: 2, error: null });
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ is, eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchOwnContactMessagesCount(supabase, "user-1")).resolves.toBe(2);
    expect(from).toHaveBeenCalledWith("contact_messages");
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(is).toHaveBeenCalledWith("user_archived_at", null);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("fetchUnreadOwnContactRepliesCount counts replies newer than last_viewed_at", async () => {
    const rows = [
      {
        id: "1",
        created_at: "2026-08-14T10:00:00.000Z",
        last_viewed_at: "2026-08-14T11:00:00.000Z",
        contact_message_replies: [
          { id: "old", created_at: "2026-08-14T10:30:00.000Z" },
          { id: "new", created_at: "2026-08-14T11:30:00.000Z" },
        ],
      },
      {
        id: "2",
        created_at: "2026-08-14T12:00:00.000Z",
        last_viewed_at: null,
        contact_message_replies: [
          { id: "reply", created_at: "2026-08-14T12:30:00.000Z" },
        ],
      },
    ];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const is = vi.fn(() => ({ order }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ is, eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(
      fetchUnreadOwnContactRepliesCount(supabase, "user-1"),
    ).resolves.toBe(2);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it.each([
    { viewedAt: "2026-10-24T12:00:00Z", archivedAt: null, expected: 0 },
    { viewedAt: null, archivedAt: "2026-10-24T12:00:00Z", expected: 0 },
    { viewedAt: null, archivedAt: null, expected: 1 },
  ])("counts only the current user's visible unread replies: %j", async ({ viewedAt, archivedAt, expected }) => {
    // An admin can receive both users' rows from RLS. Exercise the real query
    // client against a local transport that applies its outgoing filters.
    const rows = [
      {
        user_id: "admin-1",
        created_at: "2026-10-24T10:00:00Z",
        last_viewed_at: viewedAt,
        user_archived_at: archivedAt,
        contact_message_replies: [{ created_at: "2026-10-24T11:00:00Z" }],
      },
      {
        user_id: "other-user",
        created_at: "2026-10-24T10:00:00Z",
        last_viewed_at: null,
        user_archived_at: null,
        contact_message_replies: [{ created_at: "2026-10-24T11:00:00Z" }],
      },
    ];
    const supabase = createClient<Database>("https://test.supabase.co", "test", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input) => {
          const params = new URL(String(input)).searchParams;
          const visible = rows.filter(
            (row) =>
              (!params.has("user_id") ||
                params.get("user_id") === `eq.${row.user_id}`) &&
              (!params.has("user_archived_at") || row.user_archived_at === null),
          );
          return new Response(JSON.stringify(visible), {
            headers: { "Content-Type": "application/json" },
          });
        },
      },
    });

    await expect(
      fetchUnreadOwnContactRepliesCount(supabase, "admin-1"),
    ).resolves.toBe(expected);
  });

  it("insertContactMessageReply maps payload fields correctly", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const supabase = { from } as never;

    await expect(
      insertContactMessageReply(supabase, {
        contactMessageId: "msg-1",
        authorId: "admin-1",
        body: "Reply",
      }),
    ).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith("contact_message_replies");
    expect(insert).toHaveBeenCalledWith({
      contact_message_id: "msg-1",
      author_id: "admin-1",
      body: "Reply",
    });
  });

  it("markMessageRead updates read_at and filters on id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    await expect(markMessageRead(supabase, "msg-1")).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledOnce();
    const updatePayload = update.mock.calls[0]?.[0] as { read_at: string };
    expect(typeof updatePayload.read_at).toBe("string");
    expect(updatePayload.read_at.length).toBeGreaterThan(0);
    expect(eq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("markOwnContactMessagesViewed updates last_viewed_at for visible rows", async () => {
    const is = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn(() => ({ is }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    await expect(
      markOwnContactMessagesViewed(supabase, "user-1"),
    ).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledOnce();
    const updatePayload = update.mock.calls[0]?.[0] as {
      last_viewed_at: string;
    };
    expect(typeof updatePayload.last_viewed_at).toBe("string");
    expect(is).toHaveBeenCalledWith("user_archived_at", null);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("archiveOwnContactMessage sets user_archived_at", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    await expect(
      archiveOwnContactMessage(supabase, "msg-1"),
    ).resolves.toBeUndefined();

    const updatePayload = update.mock.calls[0]?.[0] as {
      user_archived_at: string;
    };
    expect(typeof updatePayload.user_archived_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("archiveContactMessage sets admin_archived_at", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    await expect(
      archiveContactMessage(supabase, "msg-1"),
    ).resolves.toBeUndefined();

    const updatePayload = update.mock.calls[0]?.[0] as {
      admin_archived_at: string;
    };
    expect(typeof updatePayload.admin_archived_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("throws query errors", async () => {
    const expectedError = new Error("forbidden");
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: expectedError });
    const is = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ is }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchContactMessages(supabase)).rejects.toThrow("forbidden");
  });
});
