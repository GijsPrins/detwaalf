import type { H3Event } from "h3";

type AuthUserResponse = {
  id?: unknown;
  email?: unknown;
};

export function getBearerToken(event: H3Event) {
  const authorization = getHeader(event, "authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}

export function getSupabaseConfig(event: H3Event) {
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

// Runs has_role with the caller's own token, so the database decides.
export async function requireSupabaseRole(
  url: string,
  key: string,
  token: string,
  roleName: string,
) {
  const hasRole = await $fetch<unknown>(`${url}/rest/v1/rpc/has_role`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: { role_name: roleName },
  }).catch(() => false);

  if (hasRole !== true) {
    throw createError({
      statusCode: 403,
      statusMessage: "Not allowed",
    });
  }
}
