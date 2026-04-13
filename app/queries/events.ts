import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from '~/types/database.types'
import { DISTANCE_ORDER } from '~/constants/distances'

// Derive the client type from the Nuxt composable so we don't need
// @supabase/supabase-js as a direct dependency (pnpm won't hoist it).
type Client = ReturnType<typeof useSupabaseClient<Database>>

export type EventDistanceRow = Pick<Tables<'event_distances'>, 'id' | 'distance_category' | 'sort_order'>

export type EventRow = Tables<'events'> & {
  province: Pick<Tables<'provinces'>, 'id' | 'name' | 'slug'> | null
  event_distances: EventDistanceRow[]
}

export type ParticipationRow = Pick<Tables<'event_participations'>, 'id' | 'event_id' | 'status'>

export async function fetchEvents(supabase: Client): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, province:provinces(id, name, slug), event_distances(id, distance_category, sort_order)')
    .order('event_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as EventRow[]
}

export async function fetchUserParticipations(
  supabase: Client,
  userId: string,
): Promise<ParticipationRow[]> {
  const { data, error } = await supabase
    .from('event_participations')
    .select('id, event_id, status')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

export async function fetchProvinces(supabase: Client): Promise<Tables<'provinces'>[]> {
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name, slug')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchEvent(
  supabase: Client,
  id: string,
): Promise<EventRow> {
  const { data, error } = await supabase
    .from('events')
    .select('*, province:provinces(id, name, slug), event_distances(id, distance_category, sort_order)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EventRow
}

export async function replaceEventDistances(
  supabase: Client,
  eventId: string,
  categories: Enums<'distance_category'>[],
): Promise<void> {
  const { error: delError } = await supabase
    .from('event_distances')
    .delete()
    .eq('event_id', eventId)

  if (delError) throw delError
  if (categories.length === 0) return

  const rows = categories.map(cat => ({
    event_id: eventId,
    distance_category: cat,
    sort_order: DISTANCE_ORDER.indexOf(cat),
  }))

  const { error: insError } = await supabase
    .from('event_distances')
    .insert(rows)

  if (insError) throw insError
}

export async function fetchEventParticipation(
  supabase: Client,
  eventId: string,
  userId: string,
): Promise<ParticipationRow | null> {
  const { data, error } = await supabase
    .from('event_participations')
    .select('id, event_id, status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateEvent(
  supabase: Client,
  id: string,
  event: TablesUpdate<'events'>,
): Promise<Tables<'events'>> {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function upsertParticipation(
  supabase: Client,
  participation: TablesInsert<'event_participations'>,
): Promise<Tables<'event_participations'>> {
  const { data, error } = await supabase
    .from('event_participations')
    .upsert(participation, { onConflict: 'event_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function insertEvent(
  supabase: Client,
  event: TablesInsert<'events'>,
): Promise<Tables<'events'>> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteParticipation(
  supabase: Client,
  eventId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('event_participations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function insertParticipation(
  supabase: Client,
  participation: TablesInsert<'event_participations'>,
): Promise<Tables<'event_participations'>> {
  const { data, error } = await supabase
    .from('event_participations')
    .insert(participation)
    .select()
    .single()

  if (error) throw error
  return data
}
