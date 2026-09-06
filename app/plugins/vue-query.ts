import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.client) {
    const supabase = useSupabaseClient()
    const passwordRecovery = useState('password-recovery', () => false)
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') passwordRecovery.value = true
      if (event === 'SIGNED_OUT') {
        passwordRecovery.value = false
        queryClient.clear()
      }
    })

    nuxtApp.hook('app:beforeUnmount', () => data.subscription.unsubscribe())
  }
})
