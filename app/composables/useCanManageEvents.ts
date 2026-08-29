import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";

export function useCanManageEvents() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["canManageEvents", user.value?.id]),
    queryFn: async () => {
      if (!user.value) return false;

      const [adminResult, managerResult] = await Promise.all([
        supabase.rpc("has_role", { role_name: "admin" }),
        supabase.rpc("has_role", { role_name: "event_manager" }),
      ]);
      if (adminResult.error) throw adminResult.error;
      if (managerResult.error) throw managerResult.error;
      return !!adminResult.data || !!managerResult.data;
    },
  });
}
