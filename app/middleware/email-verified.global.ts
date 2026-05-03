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

// Supabase uses `confirmed_at` in some project configurations instead of
// `email_confirmed_at`. Check both to be safe.
function isConfirmed(user: { confirmed_at?: string; email_confirmed_at?: string }): boolean {
  return !!(user.confirmed_at || user.email_confirmed_at)
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (PUBLIC_PATHS.includes(to.path)) return
  if (to.path.startsWith('/profile/')) return

  const user = useSupabaseUser()
  if (!user.value) return

  if (isConfirmed(user.value)) return

  // Neither confirmed_at nor email_confirmed_at in the JWT — call the API once
  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getUser()
  if (data.user && !isConfirmed(data.user)) {
    return navigateTo('/verify-email')
  }
})
