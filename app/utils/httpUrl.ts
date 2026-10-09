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

export function isOptionalHttpUrl(value: string): boolean {
  return value.trim() === "" || isSafeHttpUrl(value);
}

export function safeHttpUrl(value: unknown): string | null {
  return isSafeHttpUrl(value) ? value.trim() : null;
}
