import { describe, expect, it } from "vitest";
import { getLocalDateString } from "~/utils/localDate";

describe("getLocalDateString", () => {
  it("formats the local calendar date as yyyy-mm-dd", () => {
    const date = new Date(2026, 4, 7, 23, 30);

    expect(getLocalDateString(date)).toBe("2026-05-07");
  });
});
