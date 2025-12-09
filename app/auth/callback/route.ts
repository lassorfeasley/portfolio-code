import { NextResponse } from 'next/server';
import { supabaseServerAuth } from '@/lib/supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Determine redirect base URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

  // Log all params for debugging
  console.log('[Auth Callback] URL:', request.url);
  console.log('[Auth Callback] All params:', Object.fromEntries(searchParams.entries()));
  console.log('[Auth Callback] Code present:', !!code);

  if (code) {
    const supabase = await supabaseServerAuth();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log('[Auth Callback] Exchange result:', { data: !!data, error: error?.message });
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    // Code exchange failed - include error details
    const loginUrl = new URL('/admin/login', baseUrl);
    loginUrl.searchParams.set('error', 'code_exchange_failed');
    loginUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code provided - redirect to login with error message
  const loginUrl = new URL('/admin/login', baseUrl);
  loginUrl.searchParams.set('error', 'no_code');
  return NextResponse.redirect(loginUrl.toString());
}

