import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { Database } from "~/types/database.types";
import {
  fetchContactMessages,
  fetchUnreadContactMessagesCount,
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

export function useUnreadContactMessagesCount(options?: {
  enabled: Ref<boolean>;
}) {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: ["contactMessages", "unreadCount"],
    queryFn: () => fetchUnreadContactMessagesCount(supabase),
    enabled: options?.enabled,
  });
}

export function useSubmitContactMessage() {
  const supabase = useSupabaseClient<Database>();

  return useMutation({
    mutationFn: async (payload: {
      type: ContactMessageType;
      message: string;
      email?: string;
    }) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw error ?? new Error("Not authenticated");
      }

      return insertContactMessage(supabase, {
        userId: user.id,
        email: payload.email ?? user.email ?? "",
        type: payload.type,
        message: payload.message,
      });
    },
  });
}

export function useMarkMessageRead() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markMessageRead(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "unreadCount"],
      });
    },
  });
}
