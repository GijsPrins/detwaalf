import type { Database, Tables } from "~/types/database.types";

type Client = ReturnType<typeof useSupabaseClient<Database>>;

export type ContactMessageRow = Tables<"contact_messages">;

export type ContactMessageType = "general" | "data_request" | "delete_account";

export async function fetchContactMessages(
  supabase: Client,
): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadContactMessagesCount(
  supabase: Client,
): Promise<number> {
  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
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
  const { error } = await supabase.from("contact_messages").insert({
    user_id: payload.userId,
    email: payload.email,
    type: payload.type,
    message: payload.message,
  });

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
