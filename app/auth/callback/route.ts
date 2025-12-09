import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Determine redirect base URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

  if (code) {
    // Pass the code to a client-side page that can exchange it
    // (PKCE requires the code_verifier which is stored client-side)
    const clientCallbackUrl = new URL('/auth/confirm', baseUrl);
    clientCallbackUrl.searchParams.set('code', code);
    clientCallbackUrl.searchParams.set('next', next);
    return NextResponse.redirect(clientCallbackUrl.toString());
  }

  // No code provided - redirect to login with error message
  const loginUrl = new URL('/admin/login', baseUrl);
  loginUrl.searchParams.set('error', 'no_code');
  return NextResponse.redirect(loginUrl.toString());
}

