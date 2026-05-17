import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import type { Database, TablesInsert } from "~/types/database.types";
import { updateEventWithDistances } from "~/queries/events";
import type { EventDistanceInput } from "~/types/events";

type EventUpdate = Pick<
  TablesInsert<"events">,
  | "name"
  | "event_date"
  | "province_id"
  | "location"
  | "event_url"
  | "registration_url"
  | "registration_opens"
  | "registration_deadline"
> & {
  distances: EventDistanceInput[];
};

export function useUpdateEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EventUpdate) => {
      await updateEventWithDistances(supabase, toValue(id), input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigateTo(`/events/${toValue(id)}`);
    },
  });
}
