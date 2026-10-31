import { describe, expect, it } from "vitest";
import { findProvinceByStateName } from "~/utils/provinceLookup";

const provinces = [
  { id: 1, name: "Friesland" },
  { id: 2, name: "Noord-Holland" },
];

describe("findProvinceByStateName", () => {
  it("matches case-insensitively", () => {
    expect(findProvinceByStateName("noord-holland", provinces)?.id).toBe(2);
  });

  it("maps Fryslân to Friesland", () => {
    expect(findProvinceByStateName("Fryslân", provinces)?.id).toBe(1);
  });

  it("returns null for unknown states", () => {
    expect(findProvinceByStateName("Vlaanderen", provinces)).toBeNull();
  });
});
