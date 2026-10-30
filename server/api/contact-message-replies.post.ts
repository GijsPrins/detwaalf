import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";
import { insertContactMessageReply } from "~/queries/contactMessages";
import {
  getBearerToken,
  getSupabaseConfig,
  fetchSupabaseUser,
} from "../utils/contactMessageAuth";
import { sendContactReplyNotification } from "../utils/contactMessageNotification";

export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const { url, key } = getSupabaseConfig(event);
  const user = await fetchSupabaseUser(url, key, token);
  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    role_name: "admin",
  });
  if (roleError) {
    throw createError({ statusCode: 503, statusMessage: "Cannot verify permissions" });
  }
  if (!isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Not authorized" });
  }

  const payload = await readBody<unknown>(event).catch(() => null);
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid reply" });
  }
  const input = payload as Record<string, unknown>;
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const messageId = input.contactMessageId;
  const isMessageId = typeof messageId === "string"
    && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(messageId);
  if (!isMessageId || !body || body.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: "Invalid reply" });
  }

  // Resolve the destination from Auth, never from a client-supplied email.
  const recipient = await $fetch<string | null>(
    `${url}/rest/v1/rpc/get_contact_reply_recipient`,
    {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${token}` },
      body: { message_id: messageId },
    },
  ).catch(() => {
    throw createError({ statusCode: 503, statusMessage: "Cannot resolve reply recipient" });
  });
  const reply = await insertContactMessageReply(supabase, {
    contactMessageId: messageId,
    authorId: user.id,
    body,
  }).catch(() => {
    throw createError({ statusCode: 400, statusMessage: "Cannot save reply" });
  });
  if (!recipient) return { id: reply.id, notification: "skipped" as const };

  try {
    const config = useRuntimeConfig(event);
    await sendContactReplyNotification({
      email: recipient,
      body,
      messagesUrl: new URL("/messages", config.public.siteUrl).toString(),
    });
    return { id: reply.id, notification: "sent" as const };
  } catch {
    // The reply is already saved. Do not turn mail failure into a retryable write.
    console.error("Failed to send contact reply notification", { replyId: reply.id });
    return { id: reply.id, notification: "failed" as const };
  }
});
