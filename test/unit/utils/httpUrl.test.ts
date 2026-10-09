import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, isOptionalHttpUrl, safeHttpUrl } from "~/utils/httpUrl";

describe("HTTP URL validation", () => {
  it.each(["https://example.org/results?a=1#finish", "http://example.org", "HTTPS://example.org", " https://example.org "])("allows %s", (url) => {
    expect(isSafeHttpUrl(url)).toBe(true);
  });

  it.each([null, undefined, "", "javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)", "data:text/html,test", "//example.org", "/results", "https://", "https://user:password@example.org", "https://example.org\\@evil.org", "https://example.org/a b", "https://example.org/\u0000"])("rejects %s", (url) => {
    expect(isSafeHttpUrl(url)).toBe(false);
    expect(safeHttpUrl(url)).toBeNull();
  });

  it("allows empty optional inputs and trims rendered URLs", () => {
    expect(isOptionalHttpUrl("  ")).toBe(true);
    expect(isOptionalHttpUrl("ftp://example.org")).toBe(false);
    expect(safeHttpUrl(" https://example.org ")).toBe("https://example.org");
  });

  it("rejects an empty user-info delimiter", () => {
    expect(isSafeHttpUrl("https://@example.org")).toBe(false);
  });
});
