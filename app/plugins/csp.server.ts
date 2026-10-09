import { randomBytes } from "node:crypto";

export default defineNuxtPlugin((nuxtApp) => {
  // Vite's development client needs a different policy; enforce on built servers.
  if (import.meta.dev) return;

  const head = nuxtApp.ssrContext?.head;
  if (!head) return;

  const nonce = randomBytes(32).toString("base64");
  const supabaseUrl = new URL(useRuntimeConfig().public.supabase.url);
  const supabaseWebSocket = new URL(supabaseUrl.origin);
  supabaseWebSocket.protocol = supabaseUrl.protocol === "https:" ? "wss:" : "ws:";

  // Only scripts registered with Nuxt's head renderer are trusted. Never add
  // nonces by scanning rendered HTML, which could also contain injected markup.
  head.hooks.hook("tags:resolve", ({ tags }) => {
    for (const tag of tags) {
      if (tag.tag === "script") tag.props.nonce = nonce;
    }
  });

  useResponseHeader("Content-Security-Policy").value = [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${supabaseUrl.origin}`,
    `connect-src 'self' ${supabaseUrl.origin} ${supabaseWebSocket.origin} https://nominatim.openstreetmap.org`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // A nonce belongs to one response. Do not reuse SSR HTML via browser/CDN caches.
  useResponseHeader("Cache-Control").value = "private, no-store";
});
