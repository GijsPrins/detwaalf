import { useQuery } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { fetchEventParticipation } from "~/queries/events";

export function useEventParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: computed(() => ["eventParticipation", toValue(eventId)]),
    enabled: computed(() => Boolean(toValue(eventId))),
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return null;

      return fetchEventParticipation(supabase, toValue(eventId));
    },
  });
}
