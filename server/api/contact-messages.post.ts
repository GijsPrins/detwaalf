import type { ContactMessageType } from "~/queries/contactMessages";
import {
  fetchContactMessageRateLimitCounts,
  isContactMessageRateLimited,
  isContactMessageRateLimitError,
} from "~/utils/contactMessageRateLimit";

type ContactMessagePayload = {
  type?: unknown;
  message?: unknown;
  email?: unknown;
};

type ContactMessageInsertResponse = Array<{
  id?: unknown;
}>;

function isContactMessagePayload(value: unknown): value is ContactMessagePayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

async function insertContactMessage(
  url: string,
  key: string,
  token: string,
  input: {
    userId: string;
    email: string;
    type: ContactMessageType;
    message: string;
  },
) {
  const rows = await $fetch<ContactMessageInsertResponse>(
    `${url}/rest/v1/contact_messages?select=id`,
    {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: {
        user_id: input.userId,
        email: input.email,
        type: input.type,
        message: input.message,
      },
    },
  );
  const id = rows[0]?.id;

  if (typeof id !== "string") {
    throw createError({
      statusCode: 500,
      statusMessage: "Contact message was not created",
    });
  }

  return { id };
}

export default defineEventHandler(async (event) => {
  const token = getBearerToken(event);

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  const { url, key } = getSupabaseConfig(event);
  const user = await fetchSupabaseUser(url, key, token);
  const rawBody = await readBody<unknown>(event).catch(() => null);
  if (!isContactMessagePayload(rawBody)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid contact message",
    });
  }
  const body = rawBody;
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

  const rateLimitCounts = await fetchContactMessageRateLimitCounts({
    url,
    key,
    token,
    userId: user.id,
  });
  if (isContactMessageRateLimited(rateLimitCounts)) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too many contact messages",
    });
  }

  let contactMessage: { id: string };
  try {
    contactMessage = await insertContactMessage(url, key, token, {
      userId: user.id,
      email,
      type: body.type,
      message,
    });
  } catch (error) {
    if (isContactMessageRateLimitError(error)) {
      throw createError({
        statusCode: 429,
        statusMessage: "Too many contact messages",
      });
    }
    throw error;
  }

  try {
    const runtimeConfig = useRuntimeConfig(event);
    const adminUrl = new URL(
      "/admin/messages",
      runtimeConfig.public.siteUrl,
    );

    void sendContactMessageNotification({
      id: contactMessage.id,
      email,
      type: body.type,
      message,
      adminUrl: adminUrl.toString(),
    }).catch((notificationError) => {
      console.error("Failed to send contact message notification", {
        contactMessageId: contactMessage.id,
        error: notificationError,
      });
    });
  } catch (notificationSetupError) {
    console.error("Failed to schedule contact message notification", {
      contactMessageId: contactMessage.id,
      error: notificationSetupError,
    });
  }

  return { id: contactMessage.id };
});
