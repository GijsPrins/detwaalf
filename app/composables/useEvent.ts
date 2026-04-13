import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database } from '~/types/database.types'
import { fetchEvent, fetchEventParticipation } from '~/queries/events'
import { mapEvent } from '~/mappers/events'

export function useEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useQuery({
    queryKey: computed(() => ['events', toValue(id), user.value?.id]),
    queryFn: async () => {
      const eventId = toValue(id)
      const userId = user.value?.id
      const [event, participation] = await Promise.all([
        fetchEvent(supabase, eventId),
        userId
          ? fetchEventParticipation(supabase, eventId, userId)
          : Promise.resolve(null),
      ])
      console.log('[useEvent] Fetched participation from DB:', participation)
      return mapEvent(event, participation ?? undefined)
    },
  })
}
