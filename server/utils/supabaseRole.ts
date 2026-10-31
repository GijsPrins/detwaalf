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
