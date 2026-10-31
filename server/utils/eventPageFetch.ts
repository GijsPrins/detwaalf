import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicIpAddress } from "~/utils/networkAddress";

const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_BYTES = 2_000_000;
const USER_AGENT = "TwaalfProvincies/1.0 (twaalfprovincies.run; event intake)";

function rejectUrl(statusMessage: string): never {
  throw createError({ statusCode: 400, statusMessage });
}

// Each hop is checked before we connect. A DNS answer that changes between
// this check and the connect is not covered; the route is admin-only.
async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    rejectUrl("Invalid URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    rejectUrl("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    rejectUrl("URLs with credentials are not allowed");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    rejectUrl("Only the default web ports are allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [hostname]
    : await lookup(hostname, { all: true })
        .then((results) => results.map((result) => result.address))
        .catch(() => rejectUrl("Host could not be resolved"));

  if (addresses.length === 0 || !addresses.every(isPublicIpAddress)) {
    rejectUrl("Host is not a public address");
  }
  return url;
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (received < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);

  const bytes = new Uint8Array(Math.min(received, MAX_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, bytes.length - offset);
    bytes.set(slice, offset);
    offset += slice.byteLength;
    if (offset >= bytes.length) break;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function fetchEventPageHtml(rawUrl: string): Promise<string> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpUrl(currentUrl);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "nl,en;q=0.8",
      },
    }).catch(() => {
      throw createError({ statusCode: 502, statusMessage: "Page could not be fetched" });
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel().catch(() => undefined);
      currentUrl = new URL(location, url).toString();
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw createError({ statusCode: 502, statusMessage: `Page returned ${response.status}` });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      await response.body?.cancel().catch(() => undefined);
      throw createError({ statusCode: 422, statusMessage: "Page is not HTML" });
    }

    return readLimitedText(response);
  }

  throw createError({ statusCode: 502, statusMessage: "Too many redirects" });
}
