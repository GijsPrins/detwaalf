import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { fetchUserParticipations } from "~/queries/events";

export function useParticipations() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["eventParticipations", user.value?.id]),
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return [];

      return fetchUserParticipations(supabase, user.id);
    },
  });
}
