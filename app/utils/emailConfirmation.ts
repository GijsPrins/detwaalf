export type EmailConfirmationUser = {
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
};

export function hasConfirmedEmail(
  user: EmailConfirmationUser | null | undefined,
): boolean {
  if (!user) return false;

  return Boolean(user.confirmed_at || user.email_confirmed_at);
}
