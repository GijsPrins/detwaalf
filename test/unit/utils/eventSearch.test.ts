import { describe, expect, it } from "vitest";
import { matchesEventSearch } from "~/utils/eventSearch";

const event = {
  name: "Alfa Laval Stevensloop",
  location: "Nijmegen",
  eventUrl: "https://alfalavalstevensloop.nl/",
  registrationUrl: "https://inschrijven.nl/stevensloop",
};

describe("matchesEventSearch", () => {
  it.each([
    "stevensloop",
    "NIJMEGEN",
    "alfalavalstevensloop.nl",
    "inschrijven.nl",
  ])("matches %s in event details", (query) => {
    expect(matchesEventSearch(event, query)).toBe(true);
  });

  it("ignores accents", () => {
    expect(
      matchesEventSearch({ ...event, name: "Müllerloop" }, "mullerloop"),
    ).toBe(true);
  });

  it("returns false for unrelated searches", () => {
    expect(matchesEventSearch(event, "Eindhoven")).toBe(false);
  });

  it("matches an empty query", () => {
    expect(matchesEventSearch(event, "  ")).toBe(true);
  });
});
