import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "~/types/database.types";
import type { EventDistanceInput } from "~/types/events";

// Derive the client type from the Nuxt composable so we don't need
// @supabase/supabase-js as a direct dependency (pnpm won't hoist it).
type Client = ReturnType<typeof useSupabaseClient<Database>>;

export type EventDistanceRow = Pick<
  Tables<"event_distances">,
  "id" | "distance" | "distance_category" | "sort_order"
>;

export type EventRow = Tables<"events"> & {
  province: Pick<Tables<"provinces">, "id" | "name" | "slug"> | null;
  event_distances: EventDistanceRow[];
};

export type ParticipationRow = Pick<
  Tables<"event_participations">,
  "id" | "event_id" | "event_distance_id" | "status"
>;

export type UserParticipationRow = ParticipationRow & {
  finish_time_seconds: number | null;
  event_distance: Pick<
    Tables<"event_distances">,
    "distance" | "distance_category"
  > | null;
};

export async function fetchEvents(supabase: Client): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, province:provinces(id, name, slug), event_distances(id, distance, distance_category, sort_order)",
    )
    .order("event_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchUserParticipations(
  supabase: Client,
  userId: string,
): Promise<UserParticipationRow[]> {
  const { data, error } = await supabase
    .from("event_participations")
    .select(
      "id, event_id, event_distance_id, status, finish_time_seconds, event_distance:event_distances(distance, distance_category)",
    )
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as UserParticipationRow[];
}

export async function fetchProvinces(
  supabase: Client,
): Promise<Tables<"provinces">[]> {
  const { data, error } = await supabase
    .from("provinces")
    .select("id, name, slug")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchEvent(
  supabase: Client,
  id: string,
): Promise<EventRow> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, province:provinces(id, name, slug), event_distances(id, distance, distance_category, sort_order)",
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function replaceEventDistances(
  supabase: Client,
  eventId: string,
  distances: EventDistanceInput[],
): Promise<void> {
  const { error: delError } = await supabase
    .from("event_distances")
    .delete()
    .eq("event_id", eventId);

  if (delError) throw delError;
  if (distances.length === 0) return;

  const rows = distances.map((distance, index) => ({
    event_id: eventId,
    distance: distance.distance,
    distance_category: distance.distanceCategory,
    sort_order: index,
  }));

  const { error: insError } = await supabase
    .from("event_distances")
    .insert(rows);

  if (insError) throw insError;
}

export type DetailParticipationRow = ParticipationRow & {
  finish_time_seconds: number | null;
  timing_url: string | null;
  notes: string | null;
};

export async function fetchEventParticipation(
  supabase: Client,
  eventId: string,
  userId: string,
): Promise<DetailParticipationRow | null> {
  const { data, error } = await supabase
    .from("event_participations")
    .select("id, event_id, event_distance_id, status, finish_time_seconds, timing_url, notes")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as DetailParticipationRow | null;
}

export async function updateEvent(
  supabase: Client,
  id: string,
  event: TablesUpdate<"events">,
): Promise<Tables<"events">> {
  const { data, error } = await supabase
    .from("events")
    .update(event)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveParticipation(
  supabase: Client,
  participation: Pick<
    TablesInsert<"event_participations">,
    "event_id" | "status" | "event_distance_id"
  > & {
    finish_time_seconds?: number | null;
    timing_url?: string | null;
    notes?: string | null;
  },
  userId: string,
): Promise<Tables<"event_participations">> {
  const updatePayload = {
    status: participation.status,
    event_distance_id: participation.event_distance_id ?? null,
    finish_time_seconds: participation.finish_time_seconds ?? null,
    timing_url: participation.timing_url ?? null,
    notes: participation.notes ?? null,
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from("event_participations")
    .update(updatePayload)
    .eq("event_id", participation.event_id)
    .eq("user_id", userId)
    .select("id, event_id, event_distance_id, status");

  if (updateError) throw updateError;
  if ((updatedRows?.length ?? 0) > 0) {
    return updatedRows![0] as Tables<"event_participations">;
  }

  const { data: insertedData, error: insertError } = await supabase
    .from("event_participations")
    .insert({
      event_id: participation.event_id,
      status: participation.status,
      event_distance_id: participation.event_distance_id ?? null,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return insertedData;
}

export async function insertEvent(
  supabase: Client,
  event: TablesInsert<"events">,
): Promise<Tables<"events">> {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteParticipation(
  supabase: Client,
  eventId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("event_participations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function insertParticipation(
  supabase: Client,
  participation: TablesInsert<"event_participations">,
): Promise<Tables<"event_participations">> {
  const { data, error } = await supabase
    .from("event_participations")
    .insert(participation)
    .select()
    .single();

  if (error) throw error;
  return data;
}
