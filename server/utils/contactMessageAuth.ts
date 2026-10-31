type AuthUserResponse = {
  id?: unknown;
  email?: unknown;
};

export function getBearerToken(event: Parameters<typeof getHeader>[0]) {
  const authorization = getHeader(event, "authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}

export function getSupabaseConfig(event: Parameters<typeof useRuntimeConfig>[0]) {
  const runtimeConfig = useRuntimeConfig(event);
  const publicSupabase = runtimeConfig.public.supabase as
    | { url?: string; key?: string }
    | undefined;
  const url =
    publicSupabase?.url ||
    process.env.SUPABASE_URL ||
    process.env.NUXT_PUBLIC_SUPABASE_URL ||
    "";
  const key =
    publicSupabase?.key ||
    process.env.SUPABASE_KEY ||
    process.env.NUXT_PUBLIC_SUPABASE_KEY ||
    "";

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase is not configured",
    });
  }

  return { url, key };
}

export async function fetchSupabaseUser(url: string, key: string, token: string) {
  const user = await $fetch<AuthUserResponse>(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${token}`,
    },
  }).catch(() => null);

  if (
    !user ||
    typeof user.id !== "string" ||
    (user.email !== undefined && typeof user.email !== "string")
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  return { id: user.id, email: user.email };
}
