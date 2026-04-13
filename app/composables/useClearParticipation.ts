import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database } from '~/types/database.types'
import { deleteParticipation } from '~/queries/events'
import type { EventViewModel } from '~/mappers/events'

export function useClearParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!user.value) throw new Error('Not authenticated')
      return deleteParticipation(supabase, toValue(eventId), user.value.id)
    },
    onSuccess: () => {
      const evId = toValue(eventId);
      const uid = user.value?.id;
      
      queryClient.setQueryData(
        ['events', evId, uid],
        (old: EventViewModel | undefined) => {
          if (!old) return old;
          return {
            ...old,
            participationStatus: null,
            participationId: null,
          };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
