import type { ContactMessageType } from "~/queries/contactMessages";
import type { Database } from "~/types/database.types";

type ContactMessagePayload = {
  type?: unknown;
  message?: unknown;
  email?: unknown;
};

function isContactMessageType(value: unknown): value is ContactMessageType {
  return (
    value === "general" ||
    value === "data_request" ||
    value === "delete_account"
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string) {
  return email.replace(/[\r\n]/g, "").trim();
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  const body = (await readBody(event)) as ContactMessagePayload;
  const message = String(body.message ?? "").trim();
  const email = normalizeEmail(String(user.email ?? body.email ?? ""));

  if (!isContactMessageType(body.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid message type",
    });
  }

  if (message.length === 0 || message.length > 2000 || !isValidEmail(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid contact message",
    });
  }

  const { data: contactMessage, error } = await supabase
    .from("contact_messages")
    .insert({
      user_id: user.id,
      email,
      type: body.type,
      message,
    })
    .select("id")
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  try {
    const adminUrl = new URL("/admin/messages", getRequestURL(event).origin);

    await sendContactMessageNotification({
      id: contactMessage.id,
      email,
      type: body.type,
      message,
      adminUrl: adminUrl.toString(),
    });
  } catch (notificationError) {
    console.error("Failed to send contact message notification", {
      contactMessageId: contactMessage.id,
      error: notificationError,
    });
  }

  return { id: contactMessage.id };
});
