function isProtectedEventRoute(path: string) {
  const normalizedPath = path.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/events/new") return true;

  const segments = normalizedPath.split("/").filter(Boolean);
  return (
    segments.length === 3 &&
    segments[0] === "events" &&
    segments[2] === "edit"
  );
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!isProtectedEventRoute(to.path)) return;

  const supabase = useSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return navigateTo("/login");
  }
});
