// Mirrors public.is_safe_http_url(): only http(s) links with a host, without
// credentials, whitespace or control characters.
export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  const hasHttpAuthority = /^https?:\/\/[^/?#@]+(?:[/?#]|$)/i.test(url);
  if (!hasHttpAuthority || /[\s\\\u0000-\u001f\u007f]/.test(url)) return false;

  try {
    const parsed = new URL(url);
    return Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

// Only for rendering stored links: anything unsafe is not shown at all.
export function safeHttpUrl(value: unknown): string | null {
  return isSafeHttpUrl(value) ? value.trim() : null;
}

// Form input: "uitslagen.nl/123" becomes "https://uitslagen.nl/123".
// Returns "" for empty input and null for input that is not a safe link.
export function normalizeHttpUrlInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isSafeHttpUrl(withScheme) ? withScheme : null;
}
