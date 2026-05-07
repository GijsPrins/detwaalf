import { describe, expect, it, vi } from "vitest";
import { generateProfileSlug } from "~/utils/profileSlug";

describe("generateProfileSlug", () => {
  it("returns the generated slug when rpc succeeds", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "snelle-wolf", error: null });
    const supabase = { rpc } as never;

    await expect(generateProfileSlug(supabase, "nl")).resolves.toBe(
      "snelle-wolf",
    );
    expect(rpc).toHaveBeenCalledWith("generate_profile_slug", {
      p_locale: "nl",
    });
  });

  it("throws with the rpc error message", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    const supabase = { rpc } as never;

    await expect(generateProfileSlug(supabase, "nl")).rejects.toThrow(
      "rpc failed",
    );
  });

  it("throws when rpc returns no data", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = { rpc } as never;

    await expect(generateProfileSlug(supabase, "nl")).rejects.toThrow(
      "generate_profile_slug returned no data",
    );
  });
});
