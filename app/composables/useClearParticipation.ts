import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { deleteParticipation } from "~/queries/events";

export function useClearParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();
  const user = useSupabaseUser();

  return useMutation({
    mutationFn: () => {
      const userId = user.value?.id;
      if (!userId) throw new Error("Not authenticated");
      return deleteParticipation(supabase, toValue(eventId), userId);
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
