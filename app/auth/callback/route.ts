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

  if (code) {
    const supabase = await supabaseServerAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // No code provided - redirect to login with error message
  const loginUrl = new URL('/admin/login', baseUrl);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  return NextResponse.redirect(loginUrl.toString());
}

