import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const hasAllowList = allowedEmails.length > 0;

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
  const res = NextResponse.next();
  const supabase = createSupabaseClient(req, res);

  if (!supabase) {
    // Without env vars, allow through so local dev still works.
    return res;
  }

const {
  data: { session },
} = await supabase.auth.getSession();

const { pathname } = req.nextUrl;
const isAdminRoute = pathname.startsWith('/admin');
const isLoginRoute = pathname.startsWith('/admin/login');
const isApiRoute = pathname.startsWith('/api/admin');
const isAuthLoginRoute = pathname.startsWith('/auth/login');
const isAuthCreateRoute = pathname.startsWith('/auth/create-account');
const userEmail = session?.user?.email?.toLowerCase() ?? null;
const isAllowedUser = session
  ? !hasAllowList || (userEmail ? allowedEmails.includes(userEmail) : false)
  : false;

if (isApiRoute && !isAllowedUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

if (isAdminRoute && !session && !isLoginRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirect', pathname + (req.nextUrl.search ?? ''));
    return NextResponse.redirect(redirectUrl);
  }

if (isAdminRoute && session && !isAllowedUser) {
    await supabase.auth.signOut();
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

if (session && isLoginRoute && isAllowedUser) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/admin';
    dashboardUrl.searchParams.delete('redirect');
    return NextResponse.redirect(dashboardUrl);
  }

if (session && (isAuthLoginRoute || isAuthCreateRoute)) {
  const homeUrl = req.nextUrl.clone();
  homeUrl.pathname = '/';
  homeUrl.searchParams.delete('redirect');
  return NextResponse.redirect(homeUrl);
}

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/auth/:path*'],
};

