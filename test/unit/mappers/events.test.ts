import { describe, it, expect } from "vitest";
import { mapEvent, mapEvents, formatEventDate } from "~/mappers/events";
import type {
  EventRow,
  EventDistanceRow,
  ParticipationRow,
} from "~/queries/events";

function makeEventRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: "evt-1",
    name: "Test Marathon",
    event_date: "2026-06-01",
    province_id: 3,
    location: null,
    event_url: null,
    registration_url: null,
    registration_opens: null,
    registration_deadline: null,
    created_by: "user-1",
    province: { id: 3, name: "Noord-Holland", slug: "noord-holland" },
    event_distances: [
      {
        id: "d-1",
        distance: "marathon",
        distance_category: "marathon",
        sort_order: 0,
      },
      { id: "d-2", distance: "10k", distance_category: "10k", sort_order: 1 },
    ] as EventDistanceRow[],
    ...overrides,
  } as unknown as EventRow;
}

function makeParticipation(
  overrides: Partial<ParticipationRow> = {},
): ParticipationRow {
  return {
    id: "p-1",
    event_id: "evt-1",
    event_distance_id: "d-1",
    status: "interested",
    ...overrides,
  };
}

describe("mapEvent", () => {
  it("maps all scalar fields correctly", () => {
    const vm = mapEvent(makeEventRow(), undefined);
    expect(vm.id).toBe("evt-1");
    expect(vm.name).toBe("Test Marathon");
    expect(vm.provinceName).toBe("Noord-Holland");
    expect(vm.provinceId).toBe(3);
    expect(vm.eventDate).toBe("2026-06-01");
    expect(vm.createdBy).toBe("user-1");
    expect(vm.location).toBeNull();
  });

  it("sorts distances by EVENT_DISTANCE_ORDER (10k before marathon)", () => {
    const vm = mapEvent(makeEventRow(), undefined);
    expect(vm.distances[0]!.distance).toBe("10k");
    expect(vm.distances[1]!.distance).toBe("marathon");
  });

  it("sets participation fields to null when no participation given", () => {
    const vm = mapEvent(makeEventRow(), undefined);
    expect(vm.participationId).toBeNull();
    expect(vm.participationDistanceId).toBeNull();
    expect(vm.participationStatus).toBeNull();
  });

  it("maps participation fields from row", () => {
    const vm = mapEvent(makeEventRow(), makeParticipation());
    expect(vm.participationId).toBe("p-1");
    expect(vm.participationDistanceId).toBe("d-1");
    expect(vm.participationStatus).toBe("interested");
  });

  it("falls back to empty string when province is null", () => {
    const vm = mapEvent(makeEventRow({ province: null }), undefined);
    expect(vm.provinceName).toBe("");
  });

  it("does not mutate the original event_distances array when sorting", () => {
    const row = makeEventRow();
    const originalFirst = row.event_distances[0]!.distance;
    mapEvent(row, undefined);
    expect(row.event_distances[0]!.distance).toBe(originalFirst);
  });
});

describe("mapEvents", () => {
  it("joins participations to events by event_id", () => {
    const event1 = makeEventRow({ id: "evt-1", event_distances: [] });
    const event2 = makeEventRow({ id: "evt-2", event_distances: [] });
    const participation = makeParticipation({ event_id: "evt-2" });

    const result = mapEvents([event1, event2], [participation]);
    expect(result[0]!.participationId).toBeNull();
    expect(result[1]!.participationId).toBe("p-1");
  });

  it("events without a matching participation have null participation fields", () => {
    const event = makeEventRow({ event_distances: [] });
    const result = mapEvents([event], []);
    expect(result[0]!.participationStatus).toBeNull();
  });

  it("returns empty array for empty input", () => {
    expect(mapEvents([], [])).toEqual([]);
  });
});

describe("formatEventDate", () => {
  // Node 13+ bundles full ICU data — nl-NL locale formatting works in CI without extra flags.
  it("formats ISO date as Dutch long date", () => {
    expect(formatEventDate("2026-06-01")).toBe("1 juni 2026");
  });

  it("handles end-of-year dates correctly", () => {
    expect(formatEventDate("2026-12-31")).toBe("31 december 2026");
  });

  it("handles single-digit day without padding", () => {
    expect(formatEventDate("2026-03-05")).toBe("5 maart 2026");
  });
});
