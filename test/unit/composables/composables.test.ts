import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, toValue } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  deleteEvent,
  deleteParticipation,
  createEventWithDistances,
  fetchEvent,
  fetchEventParticipation,
  fetchEvents,
  fetchProvinces,
  fetchUserParticipations,
  saveParticipation,
  updateEventWithDistances,
} from "~/queries/events";
import {
  deleteSlugWord,
  fetchSlugWords,
  insertSlugWord,
  insertSlugWords,
  updateSlugWord,
} from "~/queries/slugWords";
import {
  fetchContactMessages,
  fetchUnreadContactMessagesCount,
  insertContactMessage,
  markMessageRead,
} from "~/queries/contactMessages";
import {
  fetchPublicParticipations,
  fetchPublicProfile,
} from "~/queries/profiles";
import { mapEvent } from "~/mappers/events";
import { useAddEvent } from "~/composables/useAddEvent";
import { useCanManageEvents } from "~/composables/useCanManageEvents";
import { useClearParticipation } from "~/composables/useClearParticipation";
import { useCompleteParticipation } from "~/composables/useCompleteParticipation";
import {
  useContactMessages,
  useMarkMessageRead,
  useSubmitContactMessage,
  useUnreadContactMessagesCount,
} from "~/composables/useContactMessages";
import { useDeleteEvent } from "~/composables/useDeleteEvent";
import { useEvent } from "~/composables/useEvent";
import { useEventList } from "~/composables/useEventList";
import { useEventParticipation } from "~/composables/useEventParticipation";
import { useParticipations } from "~/composables/useParticipations";
import { useProfile } from "~/composables/useProfile";
import { useProvinces } from "~/composables/useProvinces";
import { usePublicProfile } from "~/composables/usePublicProfile";
import { useSetParticipation } from "~/composables/useSetParticipation";
import {
  useAddSlugWord,
  useBulkAddSlugWords,
  useDeleteSlugWord,
  useSlugWords,
  useUpdateSlugWord,
} from "~/composables/useSlugWords";
import { useUpdateEvent } from "~/composables/useUpdateEvent";

vi.mock("@tanstack/vue-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("~/queries/events", () => ({
  fetchEvents: vi.fn(),
  fetchEvent: vi.fn(),
  fetchUserParticipations: vi.fn(),
  fetchProvinces: vi.fn(),
  fetchEventParticipation: vi.fn(),
  saveParticipation: vi.fn(),
  deleteParticipation: vi.fn(),
  deleteEvent: vi.fn(),
  createEventWithDistances: vi.fn(),
  insertEvent: vi.fn(),
  replaceEventDistances: vi.fn(),
  insertParticipation: vi.fn(),
  updateEvent: vi.fn(),
  updateEventWithDistances: vi.fn(),
}));

vi.mock("~/queries/slugWords", () => ({
  fetchSlugWords: vi.fn(),
  insertSlugWord: vi.fn(),
  insertSlugWords: vi.fn(),
  updateSlugWord: vi.fn(),
  deleteSlugWord: vi.fn(),
}));

vi.mock("~/queries/contactMessages", () => ({
  fetchContactMessages: vi.fn(),
  fetchUnreadContactMessagesCount: vi.fn(),
  insertContactMessage: vi.fn(),
  markMessageRead: vi.fn(),
}));

vi.mock("~/queries/profiles", () => ({
  fetchPublicProfile: vi.fn(),
  fetchPublicParticipations: vi.fn(),
}));

vi.mock("~/mappers/events", () => ({
  mapEvent: vi.fn(),
}));

describe("composables", () => {
  const queryClient = {
    invalidateQueries: vi.fn(),
    refetchQueries: vi.fn(),
    setQueryData: vi.fn(),
    setQueriesData: vi.fn(),
  };

  const supabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (globalThis as { computed: typeof computed }).computed = computed;
    (globalThis as { toValue: typeof toValue }).toValue = toValue;
    (globalThis as { navigateTo: ReturnType<typeof vi.fn> }).navigateTo =
      vi.fn();
    (
      globalThis as { useSupabaseClient: ReturnType<typeof vi.fn> }
    ).useSupabaseClient = vi.fn(() => supabase);
    (
      globalThis as { useSupabaseUser: ReturnType<typeof vi.fn> }
    ).useSupabaseUser = vi.fn(() =>
      ref({ id: "user-1", email: "user@example.com" }),
    );

    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    supabase.rpc.mockResolvedValue({ data: false });

    vi.mocked(useQueryClient).mockReturnValue(queryClient as never);

    vi.mocked(useQuery).mockImplementation((options: object) => ({
      ...options,
      data: ref(undefined),
      isLoading: ref(false),
      isError: ref(false),
    }));

    vi.mocked(useMutation).mockImplementation((options: object) => ({
      ...options,
      mutateAsync: async (payload: unknown) => {
        const mutationOptions = options as {
          mutationFn: (input: unknown) => Promise<unknown> | unknown;
          onSuccess?: (data: unknown, variables: unknown) => void;
        };
        const data = await mutationOptions.mutationFn(payload);
        mutationOptions.onSuccess?.(data, payload);
        return data;
      },
      isPending: ref(false),
    }));
  });

  it("useEventList wires fetchEvents", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([] as never);
    const query = useEventList();

    await (query.queryFn as () => Promise<unknown>)();

    expect(query.queryKey).toEqual(["events", "list"]);
    expect(fetchEvents).toHaveBeenCalledWith(supabase);
  });

  it("useEvent wires fetchEvent + mapEvent", async () => {
    vi.mocked(fetchEvent).mockResolvedValue({ id: "ev-1" } as never);
    vi.mocked(mapEvent).mockReturnValue({ id: "mapped" } as never);

    const query = useEvent(ref("ev-1"));
    const result = await (query.queryFn as () => Promise<unknown>)();

    expect((query.queryKey as { value: unknown }).value).toEqual([
      "events",
      "detail",
      "ev-1",
    ]);
    expect(fetchEvent).toHaveBeenCalledWith(supabase, "ev-1");
    expect(mapEvent).toHaveBeenCalled();
    expect(result).toEqual({ id: "mapped" });
  });

  it("useParticipations query returns empty list when user is missing", async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const query = useParticipations();

    await expect((query.queryFn as () => Promise<unknown>)()).resolves.toEqual(
      [],
    );
  });

  it("useProvinces wires staleTime and fetchProvinces", async () => {
    vi.mocked(fetchProvinces).mockResolvedValue([] as never);
    const query = useProvinces();

    await (query.queryFn as () => Promise<unknown>)();

    expect(query.queryKey).toEqual(["provinces"]);
    expect(query.staleTime).toBe(Infinity);
    expect(fetchProvinces).toHaveBeenCalledWith(supabase);
  });

  it("useEventParticipation query handles authenticated user", async () => {
    vi.mocked(fetchEventParticipation).mockResolvedValue({
      id: "p-1",
    } as never);
    const query = useEventParticipation(ref("ev-1"));

    const result = await (query.queryFn as () => Promise<unknown>)();

    expect((query.enabled as { value: boolean }).value).toBe(true);
    expect(fetchEventParticipation).toHaveBeenCalledWith(
      supabase,
      "ev-1",
      "user-1",
    );
    expect(result).toEqual({ id: "p-1" });
  });

  it("useSetParticipation updates and invalidates relevant caches", async () => {
    vi.mocked(saveParticipation).mockResolvedValue({
      id: "p-1",
      event_id: "ev-1",
      event_distance_id: "dist-1",
    } as never);

    const mutation = useSetParticipation(ref("ev-1"));
    const data = await (
      mutation.mutationFn as (payload: unknown) => Promise<unknown>
    )({
      status: "interested",
      eventDistanceId: "dist-1",
    });

    (mutation.onSuccess as (d: any, v: any) => void)(data, {
      status: "interested",
    });

    expect(saveParticipation).toHaveBeenCalled();
    expect(queryClient.setQueriesData).toHaveBeenCalled();
    expect(queryClient.refetchQueries).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["eventParticipations"],
    });
  });

  it("useClearParticipation deletes and refreshes related participation queries", async () => {
    vi.mocked(deleteParticipation).mockResolvedValue(undefined as never);
    const mutation = useClearParticipation(ref("ev-2"));

    await (mutation.mutationFn as () => Promise<unknown>)();
    (mutation.onSuccess as () => void)();

    expect(deleteParticipation).toHaveBeenCalledWith(
      supabase,
      "ev-2",
      "user-1",
    );
    expect(queryClient.setQueriesData).toHaveBeenCalled();
    expect(queryClient.refetchQueries).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["eventParticipations"],
    });
  });

  it("useCompleteParticipation maps completion payload to saveParticipation", async () => {
    vi.mocked(saveParticipation).mockResolvedValue({ id: "p-3" } as never);
    const mutation = useCompleteParticipation();

    await (mutation.mutationFn as (payload: unknown) => Promise<unknown>)({
      eventId: "ev-3",
      eventDistanceId: "dist-3",
      status: "completed",
      finishTimeSeconds: 3500,
      timingUrl: "https://example.com",
      notes: "good run",
    });

    expect(saveParticipation).toHaveBeenCalledWith(
      supabase,
      {
        event_id: "ev-3",
        event_distance_id: "dist-3",
        status: "completed",
        finish_time_seconds: 3500,
        timing_url: "https://example.com",
        notes: "good run",
      },
      "user-1",
    );

    (mutation.onSuccess as (_data: unknown, variables: { eventId: string }) => void)(
      {},
      { eventId: "ev-3" },
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["eventParticipation", "ev-3"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["eventParticipations"],
    });
  });

  it("useDeleteEvent deletes and navigates", async () => {
    vi.mocked(deleteEvent).mockResolvedValue(undefined as never);
    const mutation = useDeleteEvent(ref("ev-4"));

    await (mutation.mutationFn as () => Promise<unknown>)();
    (mutation.onSuccess as () => void)();

    expect(deleteEvent).toHaveBeenCalledWith(supabase, "ev-4");
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["events"],
    });
    expect(globalThis.navigateTo).toHaveBeenCalledWith("/events");
  });

  it("useAddEvent creates event and sends the user to explicit participation setup", async () => {
    vi.mocked(createEventWithDistances).mockResolvedValue("ev-5" as never);

    const mutation = useAddEvent();
    const payload = {
      name: "Test Event",
      province_id: 1,
      event_date: "2026-05-07",
      distances: [{ distance: "10k", distanceCategory: "10k" }],
    };

    await (mutation.mutationFn as (payload: unknown) => Promise<unknown>)(
      payload,
    );

    (mutation.onSuccess as (eventId: string) => void)("ev-5");

    expect(createEventWithDistances).toHaveBeenCalledWith(supabase, payload);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["events"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["eventParticipations"],
    });
    expect(globalThis.navigateTo).toHaveBeenCalledWith(
      "/events/ev-5?tab=participation&created=1",
    );
  });

  it("useUpdateEvent updates event and distances then navigates to detail", async () => {
    vi.mocked(updateEventWithDistances).mockResolvedValue("ev-6" as never);

    const mutation = useUpdateEvent(ref("ev-6"));

    const payload = {
      name: "Updated Event",
      province_id: 1,
      event_date: "2026-05-07",
      location: null,
      event_url: null,
      registration_url: null,
      registration_opens: null,
      registration_deadline: null,
      distances: [{ distance: "half_marathon", distanceCategory: "half" }],
    };

    await (mutation.mutationFn as (payload: unknown) => Promise<unknown>)(
      payload,
    );
    (mutation.onSuccess as () => void)();

    expect(updateEventWithDistances).toHaveBeenCalledWith(
      supabase,
      "ev-6",
      payload,
    );
    expect(globalThis.navigateTo).toHaveBeenCalledWith("/events/ev-6");
  });

  it("contact message composables wire query and mutation behavior", async () => {
    vi.mocked(fetchContactMessages).mockResolvedValue([] as never);
    vi.mocked(fetchUnreadContactMessagesCount).mockResolvedValue(0 as never);
    vi.mocked(insertContactMessage).mockResolvedValue(undefined as never);
    vi.mocked(markMessageRead).mockResolvedValue(undefined as never);

    const enabled = ref(true);
    const query = useContactMessages({ enabled });
    const unread = useUnreadContactMessagesCount({ enabled });

    await (query.queryFn as () => Promise<unknown>)();
    await (unread.queryFn as () => Promise<unknown>)();

    const submit = useSubmitContactMessage();
    await (submit.mutationFn as (payload: unknown) => Promise<unknown>)({
      type: "general",
      message: "hello",
    });

    const mark = useMarkMessageRead();
    await (mark.mutationFn as (id: string) => Promise<unknown>)("msg-1");
    (mark.onSuccess as () => void)();

    expect(fetchContactMessages).toHaveBeenCalledWith(supabase);
    expect(fetchUnreadContactMessagesCount).toHaveBeenCalledWith(supabase);
    expect(insertContactMessage).toHaveBeenCalled();
    expect(markMessageRead).toHaveBeenCalledWith(supabase, "msg-1");
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["contactMessages"],
    });
  });

  it("slug word composables wire queries and invalidations", async () => {
    vi.mocked(fetchSlugWords).mockResolvedValue([] as never);
    vi.mocked(insertSlugWord).mockResolvedValue(undefined as never);
    vi.mocked(insertSlugWords).mockResolvedValue(undefined as never);
    vi.mocked(updateSlugWord).mockResolvedValue(undefined as never);
    vi.mocked(deleteSlugWord).mockResolvedValue(undefined as never);

    const enabled = ref(true);
    const query = useSlugWords({ enabled });
    await (query.queryFn as () => Promise<unknown>)();

    const add = useAddSlugWord();
    await (add.mutationFn as (payload: unknown) => Promise<unknown>)({
      locale: "nl",
      type: "noun",
      word: "wolf",
      active: true,
    });
    (add.onSuccess as () => void)();

    const bulk = useBulkAddSlugWords();
    await (bulk.mutationFn as (payload: unknown) => Promise<unknown>)({
      locale: "nl",
      type: "noun",
      words: ["wolf"],
      active: true,
    });

    const update = useUpdateSlugWord();
    await (update.mutationFn as (payload: unknown) => Promise<unknown>)({
      id: 1,
      locale: "nl",
      type: "noun",
      word: "wolf",
      active: false,
    });

    const del = useDeleteSlugWord();
    await (del.mutationFn as (id: number) => Promise<unknown>)(1);

    expect(fetchSlugWords).toHaveBeenCalledWith(supabase);
    expect(insertSlugWord).toHaveBeenCalled();
    expect(insertSlugWords).toHaveBeenCalled();
    expect(updateSlugWord).toHaveBeenCalled();
    expect(deleteSlugWord).toHaveBeenCalledWith(supabase, 1);
  });

  it("useCanManageEvents checks admin then event_manager roles", async () => {
    supabase.rpc
      .mockResolvedValueOnce({ data: false })
      .mockResolvedValueOnce({ data: true });

    const query = useCanManageEvents();
    const result = await (query.queryFn as () => Promise<unknown>)();

    expect(result).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith("has_role", {
      role_name: "admin",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("has_role", {
      role_name: "event_manager",
    });
  });

  it("usePublicProfile derives completed province sets and privacy flags", async () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce({
        data: ref({ id: "user-2", is_public: false }),
        isLoading: ref(false),
        isError: ref(false),
      } as never)
      .mockReturnValueOnce({
        data: ref([{ province_id: 1, distance_category: "10k" }]),
        isLoading: ref(false),
        isError: ref(false),
      } as never);

    vi.mocked(fetchPublicProfile).mockResolvedValue({ id: "user-2" } as never);
    vi.mocked(fetchPublicParticipations).mockResolvedValue([] as never);

    const result = usePublicProfile(ref("runner"));

    expect(result.completedProvinces.value["10k"].has(1)).toBe(true);
    expect(result.notFound.value).toBe(false);
    expect(result.isPrivate.value).toBe(true);
  });

  it("useProfile exposes query and mutation wrappers", async () => {
    const singleUpsert = vi
      .fn()
      .mockResolvedValue({ data: { id: "user-1" }, error: null });
    const selectUpsert = vi.fn(() => ({ single: singleUpsert }));
    const upsert = vi.fn(() => ({ select: selectUpsert }));

    supabase.from.mockReturnValue({ upsert });

    const profile = useProfile();

    await profile.updateProfile({ display_name: "Runner" });

    expect(queryClient.setQueryData).toHaveBeenCalledWith(["profile", "self"], {
      id: "user-1",
    });
  });
});
