import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { Database } from "~/types/database.types";
import {
  fetchContactMessages,
  insertContactMessage,
  markMessageRead,
  type ContactMessageType,
} from "~/queries/contactMessages";

export function useContactMessages(options?: { enabled: Ref<boolean> }) {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: ["contactMessages"],
    queryFn: () => fetchContactMessages(supabase),
    enabled: options?.enabled,
  });
}

export function useSubmitContactMessage() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useMutation({
    mutationFn: (payload: {
      type: ContactMessageType;
      message: string;
      email?: string;
    }) =>
      insertContactMessage(supabase, {
        userId: user.value!.id,
        email: payload.email ?? user.value!.email ?? "",
        type: payload.type,
        message: payload.message,
      }),
  });
}

export function useMarkMessageRead() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markMessageRead(supabase, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] }),
  });
}
