import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";

export function useHasRole(role: string) {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["hasRole", role, user.value?.id]),
    queryFn: async () => {
      if (!user.value) return false;

      const { data, error } = await supabase.rpc("has_role", {
        role_name: role,
      });
      if (error) throw error;
      return !!data;
    },
  });
}
