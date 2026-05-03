import type { Database } from '~/types/database.types'

type Client = ReturnType<typeof useSupabaseClient<Database>>

// generate_profile_slug is not yet in the generated Database types.
// Regenerate with: npx supabase gen types typescript --linked > app/types/database.types.ts
export async function generateProfileSlug(supabase: Client, locale: string): Promise<string> {
  const rpc = supabase.rpc as (
    fn: string,
    args: Record<string, string>
  ) => Promise<{ data: string | null; error: { message: string } | null }>

  const { data, error } = await rpc('generate_profile_slug', { p_locale: locale })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('generate_profile_slug returned no data')
  return data
}
