import { describe, expect, it } from "vitest";
import { PROVINCE_COUNT, PROVINCE_NAMES, SLUG_TO_ID } from "~/constants/provinces";

describe("province constants", () => {
  it("exposes exactly 12 provinces", () => {
    expect(PROVINCE_COUNT).toBe(12);
    expect(Object.keys(PROVINCE_NAMES)).toHaveLength(PROVINCE_COUNT);
  });

  it("maps each slug to a known province id", () => {
    for (const id of Object.values(SLUG_TO_ID)) {
      expect(PROVINCE_NAMES[id]).toBeTruthy();
    }
  });

  it("contains stable known entries", () => {
    expect(PROVINCE_NAMES[1]).toBe("Groningen");
    expect(PROVINCE_NAMES[12]).toBe("Limburg");
    expect(SLUG_TO_ID.gr).toBe(1);
    expect(SLUG_TO_ID.li).toBe(12);
  });
});
