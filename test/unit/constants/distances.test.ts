import { describe, expect, it } from "vitest";
import {
  DISTANCE_BADGE_CLASS,
  DISTANCE_COLORS,
  DISTANCE_ORDER,
  EVENT_DISTANCE_ORDER,
} from "~/constants/distances";

describe("distance constants", () => {
  it("defines expected distance category order", () => {
    expect(DISTANCE_ORDER).toEqual(["10k", "half", "marathon"]);
  });

  it("defines expected event distance order", () => {
    expect(EVENT_DISTANCE_ORDER).toEqual([
      "10k",
      "15k",
      "10_miles",
      "half_marathon",
      "30k",
      "marathon",
    ]);
  });

  it("provides a color and badge class for each distance category", () => {
    for (const category of DISTANCE_ORDER) {
      expect(DISTANCE_COLORS[category]).toBeTruthy();
      expect(DISTANCE_BADGE_CLASS[category]).toContain("text-");
    }
  });
});
