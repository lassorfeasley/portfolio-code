import { supabaseServerAuth } from '@/lib/supabase/ssr';
import { ForbiddenError, UnauthorizedError } from '@/lib/api/errors';
import { isAllowedAdminEmail } from '@/lib/auth/allowlist';

export async function requireAdminSession() {
  const supabase = await supabaseServerAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError('Sign in to continue.');
  }
  if (!isAllowedAdminEmail(user.email)) {
    throw new ForbiddenError('Your account is not authorized.');
  }

  return { supabase, user };
}
