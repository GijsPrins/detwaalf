import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_MESSAGE_RATE_LIMITS,
  fetchContactMessageRateLimitCounts,
  isContactMessageRateLimitError,
  isContactMessageRateLimited,
} from "~/utils/contactMessageRateLimit";

describe("contact message rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as { $fetch: ReturnType<typeof vi.fn> }).$fetch = vi.fn();
  });

  it("flags either configured limit", () => {
    expect(
      isContactMessageRateLimited({
        shortWindowCount: CONTACT_MESSAGE_RATE_LIMITS.shortWindow.maxMessages,
        dailyWindowCount: 0,
      }),
    ).toBe(true);
    expect(
      isContactMessageRateLimited({
        shortWindowCount: 0,
        dailyWindowCount: CONTACT_MESSAGE_RATE_LIMITS.dailyWindow.maxMessages,
      }),
    ).toBe(true);
  });

  it("allows users below both limits", () => {
    expect(
      isContactMessageRateLimited({
        shortWindowCount:
          CONTACT_MESSAGE_RATE_LIMITS.shortWindow.maxMessages - 1,
        dailyWindowCount:
          CONTACT_MESSAGE_RATE_LIMITS.dailyWindow.maxMessages - 1,
      }),
    ).toBe(false);
  });

  it("counts both windows using the authenticated caller", async () => {
    vi.mocked(globalThis.$fetch)
      .mockResolvedValueOnce([{ id: "recent-1" }, { id: "recent-2" }])
      .mockResolvedValueOnce([{ id: "daily-1" }]);

    await expect(
      fetchContactMessageRateLimitCounts({
        url: "https://example.supabase.co",
        key: "anon-key",
        token: "access-token",
        userId: "user-1",
        now: new Date("2026-08-29T12:00:00.000Z"),
      }),
    ).resolves.toEqual({ shortWindowCount: 2, dailyWindowCount: 1 });

    expect(globalThis.$fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.$fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/v1/contact_messages?"),
      {
        headers: {
          apikey: "anon-key",
          authorization: "Bearer access-token",
        },
      },
    );
  });

  it("recognizes the database rate-limit error", () => {
    expect(
      isContactMessageRateLimitError(
        new Error("Database error: contact_message_rate_limit"),
      ),
    ).toBe(true);
    expect(isContactMessageRateLimitError(new Error("other"))).toBe(false);
  });
});
