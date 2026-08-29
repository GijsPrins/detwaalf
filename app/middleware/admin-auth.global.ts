export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin")) return;

  const supabase = useSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return navigateTo("/login");

  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    role_name: "admin",
  });
  if (error || !isAdmin) return navigateTo("/dashboard");
});
