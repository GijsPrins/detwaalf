import { useQuery } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'
import { fetchEvents, fetchUserParticipations } from '~/queries/events'
import { mapEvents } from '~/mappers/events'

export function useEventList() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const userId = user.value?.id
      const [events, participations] = await Promise.all([
        fetchEvents(supabase),
        userId
          ? fetchUserParticipations(supabase, userId)
          : Promise.resolve([]),
      ])
      return mapEvents(events, participations)
    },
  })
}
