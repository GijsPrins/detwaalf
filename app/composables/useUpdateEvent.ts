import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database, Enums, TablesUpdate } from '~/types/database.types'
import { updateEvent, replaceEventDistances } from '~/queries/events'

type EventUpdate = Omit<TablesUpdate<'events'>, 'id' | 'created_by'> & {
  distances: Enums<'distance_category'>[]
}

export function useUpdateEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventUpdate) => {
      const { distances, ...eventData } = input
      await updateEvent(supabase, toValue(id), eventData)
      await replaceEventDistances(supabase, toValue(id), distances)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigateTo(`/events/${toValue(id)}`)
    },
  })
}
