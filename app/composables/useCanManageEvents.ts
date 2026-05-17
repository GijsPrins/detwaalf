import { useQuery } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'

export function useCanManageEvents() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  return useQuery({
    queryKey: computed(() => ['canManageEvents', user.value?.id]),
    queryFn: async () => {
      const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', { role_name: 'admin' })
      if (adminError) throw adminError
      if (isAdmin) return true
      const { data: isManager, error: managerError } = await supabase.rpc('has_role', { role_name: 'event_manager' })
      if (managerError) throw managerError
      return !!isManager
    },
    enabled: computed(() => !!user.value),
  })
}
