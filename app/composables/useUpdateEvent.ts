import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database, TablesUpdate } from '~/types/database.types'
import { updateEvent } from '~/queries/events'

type EventUpdate = Omit<TablesUpdate<'events'>, 'id' | 'created_by'>

export function useUpdateEvent(id: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EventUpdate) => updateEvent(supabase, toValue(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigateTo(`/events/${toValue(id)}`)
    },
  })
}
