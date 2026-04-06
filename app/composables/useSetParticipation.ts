import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database, Enums } from '~/types/database.types'
import { upsertParticipation } from '~/queries/events'

export function useSetParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: Enums<'participation_status'>) =>
      upsertParticipation(supabase, {
        event_id: toValue(eventId),
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
