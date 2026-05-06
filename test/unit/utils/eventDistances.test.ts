import { describe, it, expect } from "vitest";
import {
  getDistanceCategoryForEventDistance,
  createEmptyEventDistanceInput,
  normalizeEventDistanceInputs,
  hasDuplicateEventDistances,
} from "~/utils/eventDistances";

describe("getDistanceCategoryForEventDistance", () => {
  it.each([
    ["10k", "10k"],
    ["15k", "10k"],
    ["10_miles", "10k"],
    ["half_marathon", "half"],
    ["30k", "half"],
    ["marathon", "marathon"],
  ] as const)("%s maps to category %s", (distance, expected) => {
    expect(getDistanceCategoryForEventDistance(distance)).toBe(expected);
  });
});

describe("createEmptyEventDistanceInput", () => {
  it("returns a valid distance", () => {
    const input = createEmptyEventDistanceInput();
    expect(input.distance).toBeDefined();
  });

  it("returns a distanceCategory consistent with the distance", () => {
    const input = createEmptyEventDistanceInput();
    expect(input.distanceCategory).toBe(
      getDistanceCategoryForEventDistance(input.distance),
    );
  });
});

describe("normalizeEventDistanceInputs", () => {
  it("corrects a stale/wrong distanceCategory to match the distance", () => {
    const result = normalizeEventDistanceInputs([
      { distance: "marathon", distanceCategory: "10k" },
    ]);
    expect(result[0]!.distanceCategory).toBe("marathon");
  });

  it("leaves already-correct entries unchanged", () => {
    const result = normalizeEventDistanceInputs([
      { distance: "half_marathon", distanceCategory: "half" },
    ]);
    expect(result[0]!.distanceCategory).toBe("half");
  });

  it("handles multiple entries", () => {
    const result = normalizeEventDistanceInputs([
      { distance: "10k", distanceCategory: "10k" },
      { distance: "30k", distanceCategory: "10k" }, // wrong
      { distance: "marathon", distanceCategory: "marathon" },
    ]);
    expect(result[0]!.distanceCategory).toBe("10k");
    expect(result[1]!.distanceCategory).toBe("half");
    expect(result[2]!.distanceCategory).toBe("marathon");
  });

  it("returns empty array for empty input", () => {
    expect(normalizeEventDistanceInputs([])).toEqual([]);
  });
});

describe("hasDuplicateEventDistances", () => {
  it("returns false when all distances are unique", () => {
    expect(
      hasDuplicateEventDistances([
        { distance: "10k", distanceCategory: "10k" },
        { distance: "marathon", distanceCategory: "marathon" },
      ]),
    ).toBe(false);
  });

  it("returns true when the same distance appears twice", () => {
    expect(
      hasDuplicateEventDistances([
        { distance: "10k", distanceCategory: "10k" },
        { distance: "10k", distanceCategory: "10k" },
      ]),
    ).toBe(true);
  });

  it("detects duplicates even with inconsistent distanceCategory values", () => {
    expect(
      hasDuplicateEventDistances([
        { distance: "10k", distanceCategory: "10k" },
        { distance: "10k", distanceCategory: "marathon" }, // stale category, same distance
      ]),
    ).toBe(true);
  });

  it("returns false for a single-element array", () => {
    expect(
      hasDuplicateEventDistances([
        { distance: "10k", distanceCategory: "10k" },
      ]),
    ).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasDuplicateEventDistances([])).toBe(false);
  });
});
