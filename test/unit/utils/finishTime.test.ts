import { describe, expect, it } from "vitest";
import { formatFinishTime, parseFinishTime } from "~/utils/finishTime";

describe("finish time utilities", () => {
  it("formats durations for result display and modal prefill", () => {
    expect(formatFinishTime(6330)).toBe("1:45:30");
    expect(formatFinishTime(2730)).toBe("45:30");
  });

  it("parses supported result inputs", () => {
    expect(parseFinishTime("1:45:30")).toBe(6330);
    expect(parseFinishTime("45:30")).toBe(2730);
  });

  it("rejects invalid result inputs", () => {
    expect(parseFinishTime("1:30")).toBe(90);
    expect(parseFinishTime("invalid")).toBeNull();
    expect(parseFinishTime("1:2:3:4")).toBeNull();
  });
});
