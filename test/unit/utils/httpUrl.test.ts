import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, normalizeHttpUrlInput, safeHttpUrl } from "~/utils/httpUrl";

describe("isSafeHttpUrl", () => {
  it.each([
    "https://example.org/results?a=1#finish",
    "http://example.org",
    "HTTPS://example.org",
    " https://example.org ",
  ])("allows %s", (url) => {
    expect(isSafeHttpUrl(url)).toBe(true);
  });

  it.each([
    null,
    undefined,
    "",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,test",
    "//example.org",
    "/results",
    "https://",
    "https://user:password@example.org",
    "https://example.org\\@evil.org",
    "https://example.org/a b",
    "https://example.org/\u0000",
  ])("rejects %s", (url) => {
    expect(isSafeHttpUrl(url)).toBe(false);
    expect(safeHttpUrl(url)).toBeNull();
  });
});

describe("safeHttpUrl", () => {
  it("trims links that are safe to render", () => {
    expect(safeHttpUrl(" https://example.org ")).toBe("https://example.org");
  });
});

describe("normalizeHttpUrlInput", () => {
  it("returns an empty string for empty input", () => {
    expect(normalizeHttpUrlInput("  ")).toBe("");
  });

  it("adds https to links typed without a scheme", () => {
    expect(normalizeHttpUrlInput(" uitslagen.nl/123 ")).toBe("https://uitslagen.nl/123");
  });

  it("keeps http(s) links and rejects other schemes", () => {
    expect(normalizeHttpUrlInput("http://example.org")).toBe("http://example.org");
    expect(normalizeHttpUrlInput("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrlInput("ftp://example.org")).toBeNull();
  });
});
