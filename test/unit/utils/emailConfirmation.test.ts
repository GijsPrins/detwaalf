import { describe, expect, it } from "vitest";
import { hasConfirmedEmail } from "~/utils/emailConfirmation";

describe("hasConfirmedEmail", () => {
  it("returns false for missing users", () => {
    expect(hasConfirmedEmail(null)).toBe(false);
    expect(hasConfirmedEmail(undefined)).toBe(false);
  });

  it("returns true when confirmed_at is present", () => {
    expect(hasConfirmedEmail({ confirmed_at: "2026-05-07T10:00:00Z" })).toBe(
      true,
    );
  });

  it("returns true when email_confirmed_at is present", () => {
    expect(
      hasConfirmedEmail({ email_confirmed_at: "2026-05-07T10:00:00Z" }),
    ).toBe(true);
  });

  it("returns false when neither confirmation claim is present", () => {
    expect(
      hasConfirmedEmail({ confirmed_at: null, email_confirmed_at: null }),
    ).toBe(false);
  });
});
