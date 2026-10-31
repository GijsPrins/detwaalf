import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { createEventWithDistances, type EventWriteInput } from "~/queries/events";

// Same write as useAddEvent, but stays on the page so many rows can be saved.
export function useBulkAddEvent() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EventWriteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User must be authenticated to add an event.");
      }

      return createEventWithDistances(supabase, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
