import { describe, expect, it, vi } from "vitest";
import {
  deleteSlugWord,
  fetchSlugWords,
  insertSlugWord,
  insertSlugWords,
  updateSlugWord,
} from "~/queries/slugWords";

describe("slugWords queries", () => {
  it("fetchSlugWords applies deterministic ordering", async () => {
    const order3 = vi
      .fn()
      .mockResolvedValue({ data: [{ id: 1 }], error: null });
    const order2 = vi.fn(() => ({ order: order3 }));
    const order1 = vi.fn(() => ({ order: order2 }));
    const select = vi.fn(() => ({ order: order1 }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from } as never;

    await expect(fetchSlugWords(supabase)).resolves.toEqual([{ id: 1 }]);
    expect(order1).toHaveBeenCalledWith("locale", { ascending: true });
    expect(order2).toHaveBeenCalledWith("type", { ascending: true });
    expect(order3).toHaveBeenCalledWith("word", { ascending: true });
  });

  it("insertSlugWord inserts payload directly", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const supabase = { from } as never;

    const payload = {
      locale: "nl",
      type: "noun" as const,
      word: "wolf",
      active: true,
    };
    await insertSlugWord(supabase, payload);

    expect(insert).toHaveBeenCalledWith(payload);
  });

  it("insertSlugWords no-ops for empty arrays", async () => {
    const upsert = vi.fn();
    const from = vi.fn(() => ({ upsert }));
    const supabase = { from } as never;

    await insertSlugWords(supabase, {
      locale: "nl",
      type: "noun",
      words: [],
      active: true,
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it("insertSlugWords builds rows and upserts with conflict options", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upsert }));
    const supabase = { from } as never;

    await insertSlugWords(supabase, {
      locale: "nl",
      type: "adjective",
      words: ["snelle", "sterke"],
      active: true,
    });

    expect(upsert).toHaveBeenCalledWith(
      [
        { locale: "nl", type: "adjective", word: "snelle", active: true },
        { locale: "nl", type: "adjective", word: "sterke", active: true },
      ],
      {
        onConflict: "locale,word",
        ignoreDuplicates: true,
      },
    );
  });

  it("updateSlugWord and deleteSlugWord target row by id", async () => {
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: eqUpdate }));

    const eqDelete = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn(() => ({ eq: eqDelete }));

    const from = vi
      .fn()
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce({ delete: remove });

    const supabase = { from } as never;

    await updateSlugWord(supabase, 7, {
      locale: "nl",
      type: "noun",
      word: "wolf",
      active: false,
    });
    await deleteSlugWord(supabase, 7);

    expect(eqUpdate).toHaveBeenCalledWith("id", 7);
    expect(eqDelete).toHaveBeenCalledWith("id", 7);
  });
});
