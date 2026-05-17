import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Database, TablesInsert } from "~/types/database.types";
import { createEventWithDistances } from "~/queries/events";
import type { EventDistanceInput } from "~/types/events";

type EventInput = Omit<TablesInsert<"events">, "created_by"> & {
  distances: EventDistanceInput[];
};

export function useAddEvent() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EventInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User must be authenticated to add an event.");
      }

      return createEventWithDistances(supabase, input);
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
      navigateTo(`/events/${eventId}?tab=participation&created=1`);
    },
  });
}
