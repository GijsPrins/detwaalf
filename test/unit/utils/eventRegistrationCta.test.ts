import { describe, expect, it } from "vitest";
import { getEventRegistrationCta } from "~/utils/eventRegistrationCta";

const today = "2026-05-17";

describe("getEventRegistrationCta", () => {
  it("shows an open CTA for upcoming events without registration dates", () => {
    expect(
      getEventRegistrationCta({ eventDate: "2026-06-01" }, today),
    ).toEqual({ type: "open" });
  });

  it("keeps the open CTA for events happening today", () => {
    expect(
      getEventRegistrationCta({ eventDate: "2026-05-17" }, today),
    ).toEqual({ type: "open" });
  });

  it("shows a future CTA before registration opens", () => {
    expect(
      getEventRegistrationCta(
        {
          eventDate: "2026-06-01",
          registrationOpens: "2026-05-30",
        },
        today,
      ),
    ).toEqual({ type: "future", opensOn: "2026-05-30" });
  });

  it("hides the CTA when registration has closed", () => {
    expect(
      getEventRegistrationCta(
        {
          eventDate: "2026-06-01",
          registrationDeadline: "2026-05-16",
        },
        today,
      ),
    ).toEqual({ type: "none" });
  });

  it("hides the CTA for past events", () => {
    expect(
      getEventRegistrationCta({ eventDate: "2026-05-16" }, today),
    ).toEqual({ type: "none" });
  });

  it("hides the CTA once the user is signed up", () => {
    expect(
      getEventRegistrationCta(
        {
          eventDate: "2026-06-01",
          participationStatus: "signed_up",
        },
        today,
      ),
    ).toEqual({ type: "none" });
  });

  it("still shows the CTA while the user is only interested", () => {
    expect(
      getEventRegistrationCta(
        {
          eventDate: "2026-06-01",
          participationStatus: "interested",
        },
        today,
      ),
    ).toEqual({ type: "open" });
  });
});
