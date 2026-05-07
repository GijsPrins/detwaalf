import { describe, expect, it } from "vitest";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";

describe("participation constants", () => {
  it("contains badge classes for all participation statuses", () => {
    expect(PARTICIPATION_STATUS_BADGE_CLASS).toEqual({
      interested: "bg-orange-100 text-orange-700",
      signed_up: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      dns: "bg-gray-100 text-gray-500",
      dnf: "bg-gray-100 text-gray-500",
    });
  });
});
