import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Database, TablesInsert } from "~/types/database.types";
import {
  insertEvent,
  insertParticipation,
  replaceEventDistances,
} from "~/queries/events";
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

      const { distances, ...eventData } = input;
      const event = await insertEvent(supabase, {
        ...eventData,
        created_by: user.id,
      });

      await replaceEventDistances(supabase, event.id, distances);

      await insertParticipation(supabase, {
        event_id: event.id,
        user_id: user.id,
        status: "interested",
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigateTo("/events");
    },
  });
}
