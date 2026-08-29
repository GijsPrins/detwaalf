import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { deleteParticipation } from "~/queries/events";

export function useClearParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await deleteParticipation(supabase, toValue(eventId), user.id);
      return { userId: user.id };
    },
    onSuccess: ({ userId }) => {
      const evId = toValue(eventId);
      queryClient.setQueryData(["eventParticipation", evId, userId], null);

      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
      queryClient.invalidateQueries({ queryKey: ["eventCancellationSignals"] });
    },
  });
}
