import { describe, expect, it, vi } from "vitest";
import {
  deleteEvent,
  deleteParticipation,
  fetchEvent,
  fetchEventParticipation,
  fetchEvents,
  fetchProvinces,
  fetchUserParticipations,
  insertEvent,
  insertParticipation,
  replaceEventDistances,
  saveParticipation,
  updateEvent,
} from "~/queries/events";

describe("events queries", () => {
  it("fetchEvents requests relations and orders by date", async () => {
    const rows = [{ id: "ev-1" }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchEvents(supabase)).resolves.toEqual(rows);
    expect(select).toHaveBeenCalledWith(
      "*, province:provinces(id, name, slug), event_distances(id, distance, distance_category, sort_order)",
    );
    expect(order).toHaveBeenCalledWith("event_date", { ascending: false });
  });

  it("fetchUserParticipations filters by user_id", async () => {
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await fetchUserParticipations(supabase, "user-1");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("fetchProvinces orders by name", async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchProvinces(supabase)).resolves.toEqual([{ id: 1 }]);
    expect(order).toHaveBeenCalledWith("name");
  });

  it("fetchEvent loads one row by id", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "ev-1" }, error: null });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await fetchEvent(supabase, "ev-1");
    expect(eq).toHaveBeenCalledWith("id", "ev-1");
  });

  it("replaceEventDistances deletes existing rows and inserts mapped rows", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn(() => ({ eq: deleteEq }));
    const insert = vi.fn().mockResolvedValue({ error: null });

    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: deleteFn })
      .mockReturnValueOnce({ insert });

    const supabase = { from } as never;

    await replaceEventDistances(supabase, "ev-1", [
      { distance: "10k", distanceCategory: "10k" },
      { distance: "half_marathon", distanceCategory: "half" },
    ]);

    expect(deleteEq).toHaveBeenCalledWith("event_id", "ev-1");
    expect(insert).toHaveBeenCalledWith([
      { event_id: "ev-1", distance: "10k", distance_category: "10k", sort_order: 0 },
      {
        event_id: "ev-1",
        distance: "half_marathon",
        distance_category: "half",
        sort_order: 1,
      },
    ]);
  });

  it("replaceEventDistances skips insert when no distances are provided", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn(() => ({ eq: deleteEq }));
    const insert = vi.fn();
    const from = vi
      .fn()
      .mockReturnValueOnce({ delete: deleteFn })
      .mockReturnValueOnce({ insert });

    const supabase = { from } as never;

    await replaceEventDistances(supabase, "ev-1", []);
    expect(insert).not.toHaveBeenCalled();
  });

  it("fetchEventParticipation filters by event and user and may return null", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqUser = vi.fn(() => ({ maybeSingle }));
    const eqEvent = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqEvent }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchEventParticipation(supabase, "ev-1", "user-1")).resolves.toBeNull();
    expect(eqEvent).toHaveBeenCalledWith("event_id", "ev-1");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("updateEvent updates and returns a single row", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "ev-1" }, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    await expect(updateEvent(supabase, "ev-1", { name: "New" })).resolves.toEqual({
      id: "ev-1",
    });
  });

  it("deleteEvent deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: remove }));
    const supabase = { from } as never;

    await deleteEvent(supabase, "ev-1");
    expect(eq).toHaveBeenCalledWith("id", "ev-1");
  });

  it("saveParticipation returns updated row when update matches", async () => {
    const selectUpdate = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "p-1", event_id: "ev-1" }], error: null });
    const eqUser = vi.fn(() => ({ select: selectUpdate }));
    const eqEvent = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqEvent }));

    const insert = vi.fn();

    const from = vi
      .fn()
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce({ insert });

    const supabase = { from } as never;

    await expect(
      saveParticipation(
        supabase,
        { event_id: "ev-1", status: "interested", event_distance_id: "dist-1" },
        "user-1",
      ),
    ).resolves.toEqual({ id: "p-1", event_id: "ev-1" });

    expect(insert).not.toHaveBeenCalled();
  });

  it("saveParticipation inserts when update matches no rows", async () => {
    const selectUpdate = vi.fn().mockResolvedValue({ data: [], error: null });
    const eqUser = vi.fn(() => ({ select: selectUpdate }));
    const eqEvent = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqEvent }));

    const singleInsert = vi
      .fn()
      .mockResolvedValue({ data: { id: "p-2", event_id: "ev-2" }, error: null });
    const selectInsert = vi.fn(() => ({ single: singleInsert }));
    const insert = vi.fn(() => ({ select: selectInsert }));

    const from = vi
      .fn()
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce({ insert });

    const supabase = { from } as never;

    await expect(
      saveParticipation(
        supabase,
        { event_id: "ev-2", status: "signed_up", event_distance_id: null },
        "user-2",
      ),
    ).resolves.toEqual({ id: "p-2", event_id: "ev-2" });

    expect(insert).toHaveBeenCalledWith({
      event_id: "ev-2",
      status: "signed_up",
      event_distance_id: null,
    });
  });

  it("insertEvent and insertParticipation return inserted rows", async () => {
    const singleEvent = vi.fn().mockResolvedValue({ data: { id: "ev-3" }, error: null });
    const selectEvent = vi.fn(() => ({ single: singleEvent }));
    const insertEventFn = vi.fn(() => ({ select: selectEvent }));

    const singleParticipation = vi
      .fn()
      .mockResolvedValue({ data: { id: "p-3" }, error: null });
    const selectParticipation = vi.fn(() => ({ single: singleParticipation }));
    const insertParticipationFn = vi.fn(() => ({ select: selectParticipation }));

    const from = vi
      .fn()
      .mockReturnValueOnce({ insert: insertEventFn })
      .mockReturnValueOnce({ insert: insertParticipationFn });

    const supabase = { from } as never;

    await expect(insertEvent(supabase, { name: "Run" } as never)).resolves.toEqual({
      id: "ev-3",
    });
    await expect(
      insertParticipation(supabase, { event_id: "ev-3", status: "interested" } as never),
    ).resolves.toEqual({ id: "p-3" });
  });

  it("deleteParticipation targets event and user", async () => {
    const eqUser = vi.fn().mockResolvedValue({ error: null });
    const eqEvent = vi.fn(() => ({ eq: eqUser }));
    const remove = vi.fn(() => ({ eq: eqEvent }));
    const from = vi.fn(() => ({ delete: remove }));
    const supabase = { from } as never;

    await deleteParticipation(supabase, "ev-9", "user-9");

    expect(eqEvent).toHaveBeenCalledWith("event_id", "ev-9");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-9");
  });
});
