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
      return saveParticipation(supabase, {
        event_id: toValue(eventId),
        status,
        event_distance_id: eventDistanceId ?? null,
      }, user.id);
    },
    onSuccess: (data, variables) => {
      const evId = toValue(eventId);
      const participationKeyPrefix = ["eventParticipation", evId];

      queryClient.setQueriesData(
        { queryKey: participationKeyPrefix },
        {
          id: data.id,
          event_id: data.event_id,
          event_distance_id: data.event_distance_id,
          status: variables.status,
        },
      );

      queryClient.refetchQueries({ queryKey: participationKeyPrefix });

      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
    },
  });
}
