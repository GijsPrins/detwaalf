import { useMutation } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import type { EventPageHints } from "~/utils/eventPageHints";

export function useEventPageHints() {
  const supabase = useSupabaseClient<Database>();

  return useMutation({
    mutationFn: async (url: string) => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        throw error ?? new Error("Not authenticated");
      }

      return $fetch<EventPageHints>("/api/admin/event-hints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { url },
      });
    },
  });
}
