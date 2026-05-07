import { describe, expect, it, vi } from "vitest";
import {
  fetchContactMessages,
  fetchUnreadContactMessagesCount,
  insertContactMessage,
  markMessageRead,
} from "~/queries/contactMessages";

describe("contactMessages queries", () => {
  it("fetchContactMessages returns rows ordered by created_at desc", async () => {
    const rows = [{ id: "1" }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchContactMessages(supabase)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("contact_messages");
    expect(select).toHaveBeenCalledWith("*");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("fetchUnreadContactMessagesCount returns zero when count is null", async () => {
    const is = vi.fn().mockResolvedValue({ count: null, error: null });
    const select = vi.fn(() => ({ is }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchUnreadContactMessagesCount(supabase)).resolves.toBe(0);
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(is).toHaveBeenCalledWith("read_at", null);
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

  it("throws query errors", async () => {
    const expectedError = new Error("forbidden");
    const order = vi.fn().mockResolvedValue({ data: null, error: expectedError });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchContactMessages(supabase)).rejects.toThrow("forbidden");
  });
});
