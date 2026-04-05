import { useQuery } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'
import { fetchProvinces } from '~/queries/events'

export function useProvinces() {
  const supabase = useSupabaseClient<Database>()

  return useQuery({
    queryKey: ['provinces'],
    queryFn: () => fetchProvinces(supabase),
    staleTime: Infinity,
  })
}
