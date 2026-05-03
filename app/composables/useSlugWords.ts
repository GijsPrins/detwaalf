import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { Database } from "~/types/database.types";
import {
  deleteSlugWord,
  fetchSlugWords,
  insertSlugWord,
  insertSlugWords,
  updateSlugWord,
  type SlugWordType,
} from "~/queries/slugWords";

export function useSlugWords(options?: { enabled: Ref<boolean> }) {
  const supabase = useSupabaseClient<Database>();

  return useQuery({
    queryKey: ["slugWords"],
    queryFn: () => fetchSlugWords(supabase),
    enabled: options?.enabled,
  });
}

export function useAddSlugWord() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      locale: string;
      type: SlugWordType;
      word: string;
      active: boolean;
    }) => insertSlugWord(supabase, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slugWords"] });
    },
  });
}

export function useBulkAddSlugWords() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      locale: string;
      type: SlugWordType;
      words: string[];
      active: boolean;
    }) => insertSlugWords(supabase, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slugWords"] });
    },
  });
}

export function useUpdateSlugWord() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      id: number;
      locale: string;
      type: SlugWordType;
      word: string;
      active: boolean;
    }) =>
      updateSlugWord(supabase, payload.id, {
        locale: payload.locale,
        type: payload.type,
        word: payload.word,
        active: payload.active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slugWords"] });
    },
  });
}

export function useDeleteSlugWord() {
  const supabase = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSlugWord(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slugWords"] });
    },
  });
}
