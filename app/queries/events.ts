import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert, TablesUpdate } from '~/types/database.types'

export type EventRow = Tables<'events'> & {
  province: Pick<Tables<'provinces'>, 'id' | 'name' | 'slug'> | null
}

export type ParticipationRow = Pick<Tables<'event_participations'>, 'id' | 'event_id' | 'status'>

export async function fetchEvents(supabase: SupabaseClient<Database>): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, province:provinces(id, name, slug)')
    .order('event_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as EventRow[]
}

export async function fetchUserParticipations(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ParticipationRow[]> {
  const { data, error } = await supabase
    .from('event_participations')
    .select('id, event_id, status')
    .eq('user_id', userId)

  if (error) throw error
  return data ?? []
}

export async function fetchProvinces(supabase: SupabaseClient<Database>): Promise<Tables<'provinces'>[]> {
  const { data, error } = await supabase
    .from('provinces')
    .select('id, name, slug')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchEvent(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EventRow> {
  const { data, error } = await supabase
    .from('events')
    .select('*, province:provinces(id, name, slug)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EventRow
}

export async function fetchEventParticipation(
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<void> {
  const { error } = await supabase
    .from('event_participations')
    .delete()
    .eq('event_id', eventId)

  if (error) throw error
}

export async function insertParticipation(
  supabase: SupabaseClient<Database>,
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
