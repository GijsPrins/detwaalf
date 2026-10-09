import { describe, expect, it } from "vitest";
import {
  getCompletedProvincesByCategory,
  getProvinceMilestone,
} from "~/utils/provinceProgress";

describe("province progress", () => {
  it("collects unique completed provinces per distance category", () => {
    const events = [
      {
        id: "event-1",
        province_id: 1,
        event_distances: [{ distance_category: "10k" }],
      },
      {
        id: "event-2",
        province_id: 2,
        event_distances: [
          { distance_category: "half" },
          { distance_category: "marathon" },
        ],
      },
    ];
    const participations = [
      { event_id: "event-1", status: "completed", event_distance: null },
      {
        event_id: "event-2",
        status: "completed",
        event_distance: { distance_category: "half" },
      },
      {
        event_id: "event-2",
        status: "dnf",
        event_distance: { distance_category: "marathon" },
      },
    ];

    const result = getCompletedProvincesByCategory(events, participations);

    expect([...result["10k"]]).toEqual([1]);
    expect([...result.half]).toEqual([2]);
    expect(result.marathon.size).toBe(0);
  });

  it("recognizes the twelfth unique province as a completed route", () => {
    const completed = {
      "10k": new Set(Array.from({ length: 11 }, (_, index) => index + 1)),
      half: new Set<number>(),
      marathon: new Set<number>(),
    };

    expect(getProvinceMilestone(completed, "10k", 12)).toEqual({
      isNewProvince: true,
      completedCount: 12,
      routeCompleted: true,
    });
    expect(getProvinceMilestone(completed, "10k", 1)).toEqual({
      isNewProvince: false,
      completedCount: 11,
      routeCompleted: false,
    });
  });
});
