import { useQuery } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { fetchEventParticipation } from "~/queries/events";

export function useEventParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["eventParticipation", toValue(eventId), user.value?.id]),
    enabled: computed(() => Boolean(toValue(eventId)) && Boolean(user.value)),
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const userId = user.value?.id;
      if (!userId) return null;
      return fetchEventParticipation(supabase, toValue(eventId), userId);
    },
  });
}
