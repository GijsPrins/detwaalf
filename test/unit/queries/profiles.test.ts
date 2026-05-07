import { describe, expect, it, vi } from "vitest";
import {
  fetchPublicParticipations,
  fetchPublicProfile,
  type PublicParticipationRow,
} from "~/queries/profiles";

describe("profiles queries", () => {
  it("fetchPublicProfile uses slug filter for non-uuid values", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { slug: "runner" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const or = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq, or }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await fetchPublicProfile(supabase, "runner");

    expect(eq).toHaveBeenCalledWith("slug", "runner");
    expect(or).not.toHaveBeenCalled();
  });

  it("fetchPublicProfile uses OR filter for uuid values", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { id }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const or = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq, or }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await fetchPublicProfile(supabase, id);

    expect(or).toHaveBeenCalledWith(`slug.eq.${id},id.eq.${id}`);
    expect(eq).not.toHaveBeenCalled();
  });

  it("fetchPublicParticipations returns rpc rows", async () => {
    const data: PublicParticipationRow[] = [
      {
        province_id: 1,
        distance_category: "10k",
        event_name: "Test Run",
        event_date: "2026-05-07",
      },
    ];
    const rpc = vi.fn().mockResolvedValue({ data, error: null });
    const supabase = { rpc } as never;

    await expect(
      fetchPublicParticipations(supabase, "user-1"),
    ).resolves.toEqual(data);
    expect(rpc).toHaveBeenCalledWith("get_public_profile_participations", {
      target_user_id: "user-1",
    });
  });

  it("fetchPublicParticipations throws with rpc error message", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    const supabase = { rpc } as never;

    await expect(fetchPublicParticipations(supabase, "user-1")).rejects.toThrow(
      "rpc failed",
    );
  });
});
