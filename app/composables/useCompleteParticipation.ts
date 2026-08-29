import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { saveParticipation } from "~/queries/events";

export interface CompleteParticipationInput {
  eventId: string;
  eventDistanceId: string | null;
  status: "completed" | "dns" | "dnf" | "cancelled";
  finishTimeSeconds: number | null;
  timingUrl: string | null;
  notes: string | null;
}

export function useCompleteParticipation() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteParticipationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const participation = await saveParticipation(supabase, {
        event_id: input.eventId,
        event_distance_id: input.eventDistanceId,
        status: input.status,
        finish_time_seconds: input.finishTimeSeconds,
        timing_url: input.timingUrl,
        notes: input.notes,
      }, user.id);
      return { participation, userId: user.id };
    },
    onSuccess: async ({ participation, userId }, variables) => {
      queryClient.setQueryData(
        ["eventParticipation", variables.eventId, userId],
        participation,
      );
      await queryClient.refetchQueries({
        queryKey: ["eventParticipation", variables.eventId],
        type: "active",
      });
      queryClient.invalidateQueries({ queryKey: ["eventParticipations"] });
      queryClient.invalidateQueries({ queryKey: ["eventCancellationSignals"] });
    },
  });
}
