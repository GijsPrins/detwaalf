import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function getSelfProfileQueryKey(userId: string | null | undefined) {
  return ['profile', 'self', userId ?? null] as const
}

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const queryClient = useQueryClient()
  const profileQueryKey = computed(() => getSelfProfileQueryKey(user.value?.sub))

  const query = useQuery({
    queryKey: profileQueryKey,
    enabled: computed(() => !!user.value),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const profile = computed(() => (user.value ? (query.data.value ?? null) : null))

  const mutation = useMutation({
    mutationFn: async (update: Omit<ProfileUpdate, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ ...update, id: user.id, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(getSelfProfileQueryKey(data.id), data)
    },
  })

  return {
    profile,
    isLoading: query.isLoading,
    isError: query.isError,
    updateProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
  }
}
