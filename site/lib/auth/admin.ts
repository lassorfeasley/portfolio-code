import { supabaseServerAuth } from '@/lib/supabase/ssr';
import { ForbiddenError, UnauthorizedError } from '@/lib/api/errors';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAllowed(email: string | null | undefined): boolean {
  if (!allowedEmails.length) return true;
  if (!email) return false;
  return allowedEmails.includes(email.toLowerCase());
}

export async function requireAdminSession() {
  const supabase = supabaseServerAuth();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new UnauthorizedError('Sign in to continue.');
  }
  if (!isAllowed(session.user.email)) {
    throw new ForbiddenError('Your account is not authorized.');
  }

  return { supabase, session };
}


