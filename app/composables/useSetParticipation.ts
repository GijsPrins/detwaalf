import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import type { Database, Enums } from '~/types/database.types'
import { upsertParticipation } from '~/queries/events'
import type { EventViewModel } from '~/mappers/events'

export function useSetParticipation(eventId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: Enums<'participation_status'>) => {
      if (!user.value) throw new Error('Not authenticated')
      return upsertParticipation(supabase, {
        event_id: toValue(eventId),
        user_id: user.value.id,
        status,
      })
    },
    onSuccess: (data, status) => {
      // Optimistically update the detail cache to guarantee UI highlight instantly
      const evId = toValue(eventId);
      const uid = user.value?.id;
      queryClient.setQueryData(
        ['events', evId, uid],
        (old: EventViewModel | undefined) => {
          if (!old) return old;
          return {
            ...old,
            participationStatus: status,
            participationId: data.id,
          };
        }
      );
      
      // Still invalidate to ensure lists and other components fetch the truth
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
