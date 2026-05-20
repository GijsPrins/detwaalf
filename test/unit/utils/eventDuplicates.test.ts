import { describe, expect, it } from "vitest";
import { findPotentialDuplicateEvents } from "~/utils/eventDuplicates";

const events = [
  {
    id: "rotterdam",
    name: "NN Marathon Rotterdam",
    event_date: "2026-04-12",
    province_id: 12,
    event_url: "https://www.nnmarathonrotterdam.nl/",
    location: "Rotterdam",
  },
  {
    id: "utrecht",
    name: "Singelloop Utrecht",
    event_date: "2026-10-04",
    province_id: 9,
    event_url: null,
    location: "Utrecht",
  },
  {
    id: "other-date",
    name: "NN Marathon Rotterdam",
    event_date: "2027-04-11",
    province_id: 12,
    event_url: null,
    location: "Rotterdam",
  },
];

describe("findPotentialDuplicateEvents", () => {
  it("matches a similar name on the same date and province", () => {
    const matches = findPotentialDuplicateEvents(
      {
        name: "Marathon Rotterdam",
        eventDate: "2026-04-12",
        provinceId: 12,
      },
      events,
    );

    expect(matches[0]?.event.id).toBe("rotterdam");
    expect(matches[0]?.reason).toBe("name");
  });

  it("does not match the same name on another date", () => {
    const matches = findPotentialDuplicateEvents(
      {
        name: "NN Marathon Rotterdam",
        eventDate: "2027-04-12",
        provinceId: 12,
      },
      events,
    );

    expect(matches).toEqual([]);
  });

  it("matches an exact event url without query parameters", () => {
    const matches = findPotentialDuplicateEvents(
      {
        name: "Heel andere naam",
        eventDate: "2026-04-12",
        provinceId: 12,
        eventUrl: "https://www.nnmarathonrotterdam.nl/?utm_source=test",
      },
      events,
    );

    expect(matches[0]).toMatchObject({
      event: { id: "rotterdam" },
      reason: "url",
      score: 1,
    });
  });

  it("waits for date and province before matching", () => {
    expect(
      findPotentialDuplicateEvents(
        {
          name: "NN Marathon Rotterdam",
          eventDate: "",
          provinceId: 12,
        },
        events,
      ),
    ).toEqual([]);
  });
});
