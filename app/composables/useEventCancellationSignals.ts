import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { fetchEventCancellationSignals } from "~/queries/events";

export function useEventCancellationSignals() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["eventCancellationSignals", user.value?.sub]),
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return [];

      return fetchEventCancellationSignals(supabase);
    },
  });
}
