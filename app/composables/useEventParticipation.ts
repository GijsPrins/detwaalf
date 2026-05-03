import { useQuery } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { fetchEventParticipation } from "~/queries/events";

export function useEventParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    // Include userId in cache key so two users on the same browser never share cached participation data.
    // useSupabaseUser() may be null briefly on hydration; the queryFn resolves the authoritative user.
    queryKey: computed(() => ["eventParticipation", toValue(eventId), user.value?.id ?? null]),
    enabled: computed(() => Boolean(toValue(eventId))),
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!authUser) return null;
      return fetchEventParticipation(supabase, toValue(eventId), authUser.id);
    },
  });
}
