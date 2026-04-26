import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile', 'self'],
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
      queryClient.setQueryData(['profile', 'self'], data)
    },
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
  }
}
