export const HIDDEN_ADMIN_EMAIL = "mushfiqueyeasir@gmail.com";

export function isHiddenAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === HIDDEN_ADMIN_EMAIL;
}
