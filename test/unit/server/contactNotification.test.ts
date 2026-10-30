import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContactMessageNotification, sendContactReplyNotification } from "../../../server/utils/contactMessageNotification";

describe("Brevo contact emails", () => {
  const fetch = vi.fn();
  beforeEach(() => {
    fetch.mockReset().mockResolvedValue({ messageId: "mail-1" });
    vi.stubGlobal("$fetch", fetch);
    vi.stubGlobal("useRuntimeConfig", () => ({
      brevoApiKey: "test-api-key",
      contactNotificationFrom: "notifications@example.test",
      contactNotificationTo: "support@example.test",
    }));
  });

  it("sends the reply as plain text to the account holder with the configured sender", async () => {
    await sendContactReplyNotification({
      email: "user@example.test",
      body: "Antwoord met <strong>tekst</strong>",
      messagesUrl: "https://app.example/messages",
    });
    expect(fetch).toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", expect.objectContaining({
      method: "POST",
      timeout: 3000,
      headers: expect.objectContaining({ "api-key": "test-api-key" }),
      body: expect.objectContaining({
        sender: { name: "TwaalfProvincies.run", email: "notifications@example.test" },
        to: [{ email: "user@example.test" }],
        replyTo: { email: "support@example.test" },
        textContent: expect.stringContaining("Antwoord met <strong>tekst</strong>"),
        tags: ["contact-reply"],
      }),
    }));
    const request = fetch.mock.calls[0]?.[1];
    expect(request.body.textContent).toContain("https://app.example/messages");
    expect(request.body).not.toHaveProperty("htmlContent");
  });

  it("preserves incoming contact notifications to the admin", async () => {
    await sendContactMessageNotification({ id: "message-1", email: "user@example.test", type: "delete_account", message: "Verwijder mijn account", adminUrl: "https://app.example/admin/messages" });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: expect.objectContaining({
        to: [{ email: "support@example.test" }],
        replyTo: { email: "user@example.test" },
        textContent: expect.stringContaining("Account verwijderen"),
        tags: ["contact-message"],
      }),
    }));
  });

  it("rejects invalid reply recipients before contacting Brevo", async () => {
    await expect(sendContactReplyNotification({ email: "<verwijderde gebruiker>", body: "Antwoord", messagesUrl: "https://app.example/messages" })).rejects.toThrow("Invalid notification recipient");
    expect(fetch).not.toHaveBeenCalled();
  });
});
