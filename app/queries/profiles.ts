import type { Database, Tables } from '~/types/database.types'

type Client = ReturnType<typeof useSupabaseClient<Database>>

export type ProfileWithSlug = Tables<'profiles'> & { slug: string | null }

export type PublicParticipationRow = {
  province_id: number
  distance_category: string
  event_name: string
  event_date: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function fetchPublicProfile(
  supabase: Client,
  slugOrId: string,
): Promise<ProfileWithSlug | null> {
  const query = supabase.from('profiles').select('*')
  const { data, error } = await (
    UUID_RE.test(slugOrId)
      ? query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      : query.eq('slug', slugOrId)
  ).maybeSingle()
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
