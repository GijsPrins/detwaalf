import { extractEventPageHints } from "~/utils/eventPageHints";
import { getLocalDateString } from "~/utils/localDate";
import {
  getBearerToken,
  getSupabaseConfig,
  fetchSupabaseUser,
} from "../../utils/contactMessageAuth";
import { fetchEventPageHtml } from "../../utils/eventPageFetch";
import { requireSupabaseRole } from "../../utils/supabaseRole";

type EventHintsPayload = {
  url?: unknown;
};

function isEventHintsPayload(value: unknown): value is EventHintsPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  await fetchSupabaseUser(url, key, token);
  await requireSupabaseRole(url, key, token, "admin");

  const body = await readBody<unknown>(event).catch(() => null);
  const pageUrl =
    isEventHintsPayload(body) && typeof body.url === "string"
      ? body.url.trim()
      : "";
  if (!pageUrl || pageUrl.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid URL",
    });
  }

  const { html, finalUrl } = await fetchEventPageHtml(pageUrl);
  return extractEventPageHints(html, getLocalDateString(), finalUrl);
});
