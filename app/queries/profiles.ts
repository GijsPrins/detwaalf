import type { Database, Tables } from '~/types/database.types'

type Client = ReturnType<typeof useSupabaseClient<Database>>

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

export async function fetchPublicParticipations(
  supabase: Client,
  userId: string,
): Promise<PublicParticipationRow[]> {
  const { data, error } = await supabase.rpc(
    'get_public_profile_participations' as unknown as keyof Database['public']['Functions'],
    { target_user_id: userId } as never,
  )
  if (error) throw new Error((error as { message: string }).message)
  return (data as PublicParticipationRow[]) ?? []
}
