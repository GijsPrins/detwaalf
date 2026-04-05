import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Database, TablesInsert } from '~/types/database.types'
import { insertEvent, insertParticipation } from '~/queries/events'

type EventInput = Omit<TablesInsert<'events'>, 'created_by'>

export function useAddEvent() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EventInput) => {
      const event = await insertEvent(supabase, {
        ...input,
        created_by: user.value!.id,
      })

      await insertParticipation(supabase, {
        event_id: event.id,
        user_id: user.value!.id,
        status: 'interested',
      })

      return event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigateTo('/events')
    },
  })
}
