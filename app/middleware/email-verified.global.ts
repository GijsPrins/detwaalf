const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/confirm",
  "/events",
  "/onboarding",
  "/privacy",
  "/verify-email",
];

import { hasConfirmedEmail } from "~/utils/emailConfirmation";

function isPublicEventRoute(path: string) {
  const segments = path.split("/").filter(Boolean);
  return (
    segments.length === 2 &&
    segments[0] === "events" &&
    segments[1] !== "new"
  );
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  if (PUBLIC_PATHS.includes(to.path)) return;
  if (isPublicEventRoute(to.path)) return;
  if (to.path.startsWith("/profile/")) return;

  const user = useSupabaseUser();
  if (!user.value) return;

  if (hasConfirmedEmail(user.value)) return;

  // Neither confirmed_at nor email_confirmed_at in the JWT — call the API once
  const supabase = useSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && !hasConfirmedEmail(data.user)) {
    return navigateTo("/verify-email");
  }
});
