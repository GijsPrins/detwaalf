import type { Database, Tables } from "~/types/database.types";

type Client = ReturnType<typeof useSupabaseClient<Database>>;

export type SlugWordRow = Tables<"slug_word_list">;
export type SlugWordType = SlugWordRow["type"];

export async function fetchSlugWords(supabase: Client): Promise<SlugWordRow[]> {
  const { data, error } = await supabase
    .from("slug_word_list")
    .select("*")
    .order("locale", { ascending: true })
    .order("type", { ascending: true })
    .order("word", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertSlugWord(
  supabase: Client,
  payload: {
    locale: string;
    type: SlugWordType;
    word: string;
    active: boolean;
  },
): Promise<void> {
  const { error } = await supabase.from("slug_word_list").insert(payload);
  if (error) throw error;
}

export async function insertSlugWords(
  supabase: Client,
  payload: {
    locale: string;
    type: SlugWordType;
    words: string[];
    active: boolean;
  },
): Promise<void> {
  const rows = payload.words.map((word) => ({
    locale: payload.locale,
    type: payload.type,
    word,
    active: payload.active,
  }));

  if (!rows.length) return;

  const { error } = await supabase.from("slug_word_list").upsert(rows, {
    onConflict: "locale,word",
    ignoreDuplicates: true,
  });

  if (error) throw error;
}

export async function updateSlugWord(
  supabase: Client,
  id: number,
  payload: {
    locale: string;
    type: SlugWordType;
    word: string;
    active: boolean;
  },
): Promise<void> {
  const { error } = await supabase
    .from("slug_word_list")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSlugWord(
  supabase: Client,
  id: number,
): Promise<void> {
  const { error } = await supabase.from("slug_word_list").delete().eq("id", id);

  if (error) throw error;
}
