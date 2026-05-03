const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/confirm',
  '/events',
  '/onboarding',
  '/privacy',
  '/verify-email',
]

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC_PATHS.includes(to.path)) return

  const user = useSupabaseUser()
  if (user.value && !user.value.email_confirmed_at) {
    return navigateTo('/verify-email')
  }
})
