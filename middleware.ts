import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isAllowedAdminEmail } from '@/lib/auth/allowlist';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

function createSupabaseClient(req: NextRequest, res: NextResponse) {
  if (!url || !anonKey) return null;
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions = {}) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions = {}) {
        res.cookies.delete({ name, ...options });
      },
    },
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy password-reset links land on the homepage; the page itself is static and never reads query params.
  if (pathname === '/') {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.next();
    const callbackUrl = req.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    callbackUrl.search = '';
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('next', '/admin/reset-password');
    return NextResponse.redirect(callbackUrl);
  }

  const res = NextResponse.next();
  const supabase = createSupabaseClient(req, res);

  if (!supabase) {
    // Without env vars, allow through so local dev still works.
    return res;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname.startsWith('/admin/login');
  const isResetPasswordRoute = pathname.startsWith('/admin/reset-password');
  const isApiRoute = pathname.startsWith('/api/admin');
  const isAuthLoginRoute = pathname.startsWith('/auth/login');
  const isAuthCreateRoute = pathname.startsWith('/auth/create-account');
  const isAllowedUser = Boolean(user) && isAllowedAdminEmail(user?.email);

  if (isApiRoute && !isAllowedUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow reset-password route without authentication checks
  if (isResetPasswordRoute) {
    return res;
  }

  if (isAdminRoute && !user && !isLoginRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirect', pathname + (req.nextUrl.search ?? ''));
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute && user && !isAllowedUser) {
    await supabase.auth.signOut();
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginRoute && isAllowedUser) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/admin';
    dashboardUrl.searchParams.delete('redirect');
    return NextResponse.redirect(dashboardUrl);
  }

  if (user && (isAuthLoginRoute || isAuthCreateRoute)) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.searchParams.delete('redirect');
    return NextResponse.redirect(homeUrl);
  }

  return res;
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/admin/:path*', '/auth/:path*'],
};
