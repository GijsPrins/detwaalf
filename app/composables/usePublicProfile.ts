import { useQuery } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'
import type { DistanceCategory } from '~/constants/distances'
import {
  fetchPublicProfile,
  fetchPublicParticipations,
  type PublicParticipationRow,
} from '~/queries/profiles'

export function usePublicProfile(slugOrId: MaybeRef<string>) {
  const supabase = useSupabaseClient<Database>()

  const profileQuery = useQuery({
    queryKey: computed(() => ['profile', 'public', toValue(slugOrId)]),
    queryFn: () => fetchPublicProfile(supabase, toValue(slugOrId)),
  })

  const userId = computed(() => profileQuery.data.value?.id ?? null)

  const participationsQuery = useQuery({
    queryKey: computed(() => ['profile', 'public-participations', userId.value]),
    queryFn: () =>
      userId.value ? fetchPublicParticipations(supabase, userId.value) : [],
    enabled: computed(() => userId.value != null),
  })

  const completedProvinces = computed<Record<DistanceCategory, Set<number>>>(() => {
    const result: Record<DistanceCategory, Set<number>> = {
      '10k': new Set(),
      half: new Set(),
      marathon: new Set(),
    }
    for (const p of participationsQuery.data.value ?? []) {
      const cat = p.distance_category as DistanceCategory
      if (cat in result) result[cat].add(p.province_id)
    }
    return result
  })

  const user = useSupabaseUser()

  const isLoading = computed(
    () => profileQuery.isLoading.value || participationsQuery.isLoading.value,
  )
  const notFound = computed(
    () => !profileQuery.isLoading.value && profileQuery.data.value === null,
  )
  const isPrivate = computed(
    () =>
      profileQuery.data.value !== null &&
      !profileQuery.data.value?.is_public &&
      user.value?.id !== profileQuery.data.value?.id,
  )

  return {
    profile: profileQuery.data,
    participations: participationsQuery.data as Ref<PublicParticipationRow[] | undefined>,
    completedProvinces,
    isLoading,
    notFound,
    isPrivate,
  }
}
