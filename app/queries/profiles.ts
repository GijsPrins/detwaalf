import type { Database, Tables } from '~/types/database.types'

type Client = ReturnType<typeof useSupabaseClient<Database>>

// 'slug' column added by migration 20260503000001.
// Regenerate DB types with: npx supabase gen types typescript --linked > app/types/database.types.ts
export type ProfileWithSlug = Tables<'profiles'> & { slug: string | null }

export type PublicParticipationRow = {
  province_id: number
  actual_distance_km: number
  event_name: string
  event_date: string
}

export async function fetchPublicProfile(
  supabase: Client,
  slugOrId: string,
): Promise<ProfileWithSlug | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .maybeSingle()
  if (error) throw error
  return data as ProfileWithSlug | null
}

// get_public_profile_participations is not yet in the generated Database types.
export async function fetchPublicParticipations(
  supabase: Client,
  userId: string,
): Promise<PublicParticipationRow[]> {
  const rpc = supabase.rpc as (
    fn: string,
    args: Record<string, string>
  ) => Promise<{ data: unknown; error: { message: string } | null }>

  const { data, error } = await rpc('get_public_profile_participations', {
    target_user_id: userId,
  })
  if (error) throw new Error(error.message)
  return (data as PublicParticipationRow[]) ?? []
}
