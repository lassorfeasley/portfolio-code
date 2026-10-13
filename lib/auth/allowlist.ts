const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Sign-ups are open on the Supabase project, so an empty allowlist must deny everyone.
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails.includes(email.toLowerCase());
}
