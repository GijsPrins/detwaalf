import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database, Enums } from "~/types/database.types";
import { saveParticipation } from "~/queries/events";

interface SetParticipationInput {
  status: Enums<"participation_status">;
  eventDistanceId?: string | null;
}

export function useSetParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, eventDistanceId }: SetParticipationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const participation = await saveParticipation(supabase, {
        event_id: toValue(eventId),
        status,
        event_distance_id: eventDistanceId ?? null,
      }, user.id);
      return { participation, userId: user.id };
    },
    onSuccess: async ({ participation, userId }) => {
      const evId = toValue(eventId);
      queryClient.setQueryData(
        ["eventParticipation", evId, userId],
        participation,
      );
      await queryClient.refetchQueries({
        queryKey: ["eventParticipation", evId],
        type: "active",
      });

      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
      queryClient.invalidateQueries({ queryKey: ["eventCancellationSignals"] });
    },
  });
}
