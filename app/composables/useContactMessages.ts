import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { Database } from "~/types/database.types";
import {
  archiveContactMessage,
  archiveOwnContactMessage,
  fetchContactMessages,
  fetchOwnContactMessages,
  fetchOwnContactMessagesCount,
  fetchUnreadOwnContactRepliesCount,
  fetchUnreadContactMessagesCount,
  insertContactMessageReply,
  markOwnContactMessagesViewed,
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

export function useOwnContactMessages() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => ["contactMessages", "own", user.value?.sub ?? null]),
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return [];
      return fetchOwnContactMessages(supabase);
    },
  });
}

export function useOwnContactMessagesCount() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => [
      "contactMessages",
      "ownCount",
      user.value?.sub ?? null,
    ]),
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return 0;
      return fetchOwnContactMessagesCount(supabase);
    },
  });
}

export function useUnreadOwnContactRepliesCount() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  return useQuery({
    queryKey: computed(() => [
      "contactMessages",
      "ownUnreadReplies",
      user.value?.sub ?? null,
    ]),
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return 0;
      return fetchUnreadOwnContactRepliesCount(supabase);
    },
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      type: ContactMessageType;
      message: string;
      email?: string;
    }) => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        throw error ?? new Error("Not authenticated");
      }

      return $fetch("/api/contact-messages", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages", "own"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "ownCount"],
      });
    },
  });
}

export function useReplyToContactMessage() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { contactMessageId: string; body: string }) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw error ?? new Error("Not authenticated");
      }

      return insertContactMessageReply(supabase, {
        contactMessageId: payload.contactMessageId,
        authorId: user.id,
        body: payload.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      queryClient.invalidateQueries({ queryKey: ["contactMessages", "own"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "ownUnreadReplies"],
      });
    },
  });
}

export function useMarkOwnContactMessagesViewed() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markOwnContactMessagesViewed(supabase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages", "own"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "ownUnreadReplies"],
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

export function useArchiveOwnContactMessage() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveOwnContactMessage(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages", "own"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "ownCount"],
      });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "ownUnreadReplies"],
      });
    },
  });
}

export function useArchiveContactMessage() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveContactMessage(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      queryClient.invalidateQueries({
        queryKey: ["contactMessages", "unreadCount"],
      });
    },
  });
}
