import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { deleteEvent } from "~/queries/events";

export function useDeleteEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await deleteEvent(supabase, toValue(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigateTo("/events");
    },
  });
}
