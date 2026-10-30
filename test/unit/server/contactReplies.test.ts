import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: vi.fn(), user: vi.fn(), rpc: vi.fn(), insert: vi.fn(), single: vi.fn(),
  recipient: vi.fn(), send: vi.fn(), readBody: vi.fn(),
}));
vi.mock("../../../server/utils/contactMessageAuth", () => ({
  getBearerToken: mocks.token,
  getSupabaseConfig: () => ({ url: "https://database.example", key: "anon-key" }),
  fetchSupabaseUser: mocks.user,
}));
vi.mock("../../../server/utils/contactMessageNotification", () => ({ sendContactReplyNotification: mocks.send }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: mocks.rpc,
    from: () => ({ insert: mocks.insert }),
  }),
}));

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("createError", (input: { statusCode: number; statusMessage: string }) => Object.assign(new Error(input.statusMessage), input));
vi.stubGlobal("readBody", mocks.readBody);
vi.stubGlobal("$fetch", mocks.recipient);
vi.stubGlobal("useRuntimeConfig", () => ({ public: { siteUrl: "https://app.example" } }));
const { default: handler } = await import("../../../server/api/contact-message-replies.post");
const messageId = "00000000-0000-4000-8000-000000000001";

describe("admin reply notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token.mockReturnValue("token");
    mocks.user.mockResolvedValue({ id: "admin" });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.readBody.mockResolvedValue({ contactMessageId: messageId, body: "  Antwoord  ", email: "attacker@example.test", authorId: "someone-else" });
    mocks.recipient.mockResolvedValue("verified@example.test");
    mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }) });
    mocks.single.mockResolvedValue({ data: { id: "reply-1" }, error: null });
    mocks.send.mockResolvedValue(undefined);
  });

  const run = () => handler({} as Parameters<typeof handler>[0]);

  it("saves using authenticated author and sends only to the server-resolved destination", async () => {
    expect(await run()).toEqual({ id: "reply-1", notification: "sent" });
    expect(mocks.insert).toHaveBeenCalledWith({ contact_message_id: messageId, author_id: "admin", body: "Antwoord" });
    expect(mocks.send).toHaveBeenCalledWith({ email: "verified@example.test", body: "Antwoord", messagesUrl: "https://app.example/messages" });
  });

  it("rejects missing authentication before accessing the database", async () => {
    mocks.token.mockReturnValue("");
    await expect(run()).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects non-admins before saving or sending", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(run()).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it.each([null, { body: "hello" }, { contactMessageId: messageId, body: " " }, { contactMessageId: messageId, body: "x".repeat(2001) }])("rejects invalid input %j", async (payload) => {
    mocks.readBody.mockResolvedValue(payload);
    await expect(run()).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not save when the recipient lookup fails", async () => {
    mocks.recipient.mockRejectedValue(new Error("database unavailable"));
    await expect(run()).rejects.toMatchObject({ statusCode: 503 });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not send mail when saving the reply fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: "RLS rejected" } });
    await expect(run()).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("keeps replies for deleted or unverified accounts without sending mail", async () => {
    mocks.recipient.mockResolvedValue(null);
    expect(await run()).toEqual({ id: "reply-1", notification: "skipped" });
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("reports mail failure without failing or repeating the saved reply", async () => {
    mocks.send.mockRejectedValue(new Error("Brevo unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await run()).toEqual({ id: "reply-1", notification: "failed" });
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith("Failed to send contact reply notification", { replyId: "reply-1" });
    log.mockRestore();
  });
});
