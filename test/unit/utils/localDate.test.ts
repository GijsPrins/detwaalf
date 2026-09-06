import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  getLocalDateString,
  parseDateOnly,
} from "~/utils/localDate";

describe("getLocalDateString", () => {
  it("formats the local calendar date as yyyy-mm-dd", () => {
    const date = new Date(2026, 4, 7, 23, 30);

    expect(getLocalDateString(date)).toBe("2026-05-07");
  });
});

describe("date-only utilities", () => {
  it("parses a database date as a local calendar date", () => {
    const date = parseDateOnly("2026-01-02");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(2);
  });

  it("formats the calendar date without applying a UTC offset", () => {
    expect(
      formatDateOnly("2026-01-02T00:00:00.000Z", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    ).toBe("2 januari 2026");
  });
});
