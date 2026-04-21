import { useQuery } from "@tanstack/vue-query";
import type { Database } from "~/types/database.types";
import { fetchEvents } from "~/queries/events";

export function useEventList() {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: ["events", "list"],
    queryFn: () => fetchEvents(supabase),
  });
}
