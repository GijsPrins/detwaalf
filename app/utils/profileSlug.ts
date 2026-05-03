import type { Database } from '~/types/database.types'

type Client = ReturnType<typeof useSupabaseClient<Database>>

// generate_profile_slug is a custom RPC not in the Database['public']['Functions'] union.
// Cast through unknown to satisfy the overloaded rpc() signature.
export async function generateProfileSlug(supabase: Client, locale: string): Promise<string> {
  const { data, error } = await supabase.rpc(
    'generate_profile_slug' as unknown as keyof Database['public']['Functions'],
    { p_locale: locale } as never,
  )
  if (error) throw new Error((error as { message: string }).message)
  if (!data) throw new Error('generate_profile_slug returned no data')
  return data as string
}
