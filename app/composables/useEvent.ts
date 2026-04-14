import { useQuery } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database } from "~/types/database.types";
import { fetchEvent } from "~/queries/events";
import { mapEvent } from "~/mappers/events";

export function useEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: computed(() => ["events", "detail", toValue(id)]),
    queryFn: async () => {
      const event = await fetchEvent(supabase, toValue(id));
      return mapEvent(event, undefined);
    },
  });
}
