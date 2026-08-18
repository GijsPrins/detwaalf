import type { Database, Tables } from "~/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<Database>;

export type ContactMessageRow = Tables<"contact_messages">;
export type ContactMessageReplyRow = Tables<"contact_message_replies">;
export type ContactMessageWithReplies = ContactMessageRow & {
  contact_message_replies: ContactMessageReplyRow[];
};

export type ContactMessageType = "general" | "data_request" | "delete_account";

export async function fetchContactMessages(
  supabase: Client,
): Promise<ContactMessageWithReplies[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*, contact_message_replies(*)")
    .is("admin_archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOwnContactMessages(
  supabase: Client,
): Promise<ContactMessageWithReplies[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*, contact_message_replies(*)")
    .is("user_archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchOwnContactMessagesCount(
  supabase: Client,
): Promise<number> {
  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .is("user_archived_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function fetchUnreadOwnContactRepliesCount(
  supabase: Client,
): Promise<number> {
  const messages = await fetchOwnContactMessages(supabase);

  return messages.reduce((count, message) => {
    const viewedAt = message.last_viewed_at
      ? new Date(message.last_viewed_at).getTime()
      : new Date(message.created_at).getTime();

    return (
      count +
      message.contact_message_replies.filter(
        (reply) => new Date(reply.created_at).getTime() > viewedAt,
      ).length
    );
  }, 0);
}

export async function fetchUnreadContactMessagesCount(
  supabase: Client,
): Promise<number> {
  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .is("admin_archived_at", null)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function insertContactMessage(
  supabase: Client,
  payload: {
    userId: string;
    email: string;
    type: ContactMessageType;
    message: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .insert({
      user_id: payload.userId,
      email: payload.email,
      type: payload.type,
      message: payload.message,
    });

  if (error) throw error;
}

export async function insertContactMessageReply(
  supabase: Client,
  payload: {
    contactMessageId: string;
    authorId: string;
    body: string;
  },
): Promise<void> {
  const { error } = await supabase.from("contact_message_replies").insert({
    contact_message_id: payload.contactMessageId,
    author_id: payload.authorId,
    body: payload.body,
  });

  if (error) throw error;
}

export async function markOwnContactMessagesViewed(
  supabase: Client,
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ last_viewed_at: new Date().toISOString() })
    .is("user_archived_at", null)
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) throw error;
}

export async function archiveOwnContactMessage(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ user_archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function archiveContactMessage(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ admin_archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function markMessageRead(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
