import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { deleteParticipation } from "~/queries/events";

export function useClearParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return deleteParticipation(supabase, toValue(eventId));
    },
    onSuccess: () => {
      const evId = toValue(eventId);
      const participationKeyPrefix = ["eventParticipation", evId];

      queryClient.setQueriesData({ queryKey: participationKeyPrefix }, null);

      queryClient.refetchQueries({ queryKey: participationKeyPrefix });

      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
    },
  });
}
