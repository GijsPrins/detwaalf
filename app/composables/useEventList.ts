import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { fetchEvents, fetchUserParticipations } from "~/queries/events";
import { mapEvents } from "~/mappers/events";

export function useEventList() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["events", "list", user.value?.id]),
    queryFn: async () => {
      const [events, participations] = await Promise.all([
        fetchEvents(supabase),
        user.value?.id
          ? fetchUserParticipations(supabase)
          : Promise.resolve([]),
      ]);
      return mapEvents(events, participations);
    },
  });
}
