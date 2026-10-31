import { describe, expect, it } from "vitest";
import { listKnownEventsForPrompt } from "~/utils/eventAiPrompt";

const TODAY = "2026-10-31";

describe("listKnownEventsForPrompt", () => {
  const events = [
    {
      name: "NN Marathon Rotterdam",
      event_date: "2027-04-11",
      province_id: 11,
      event_url: "https://www.nnmarathonrotterdam.nl/",
    },
    { name: "Singelloop", event_date: "2026-11-15", province_id: 11, event_url: null },
    { name: "Vorige editie", event_date: "2026-04-12", province_id: 11 },
    { name: "Venloop", event_date: "2027-03-28", province_id: 6 },
  ];

  it("lists upcoming events in the province by date, with the website host", () => {
    expect(listKnownEventsForPrompt(events, 11, TODAY)).toEqual([
      "2026-11-15 Singelloop",
      "2027-04-11 NN Marathon Rotterdam (nnmarathonrotterdam.nl)",
    ]);
  });

  it("returns an empty list for a province without events", () => {
    expect(listKnownEventsForPrompt(events, 1, TODAY)).toEqual([]);
  });
});
