import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database } from '~/types/database.types'
import { deleteParticipation } from '~/queries/events'

export function useClearParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteParticipation(supabase, toValue(eventId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
