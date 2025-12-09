'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const exchangeCode = async () => {
      const code = searchParams?.get('code');
      const next = searchParams?.get('next') ?? '/';

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code provided.');
        return;
      }

      const supabase = supabaseBrowser();
      
      // Exchange the code for a session (PKCE code_verifier is in browser storage)
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[Auth Confirm] Exchange error:', error);
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      // Success! Redirect to the intended destination
      router.replace(next);
      router.refresh();
    };

    exchangeCode();
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-xs space-y-4 text-center">
          <h1 className="text-lg font-semibold">Authentication Failed</h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <p className="text-sm text-muted-foreground">
            This usually happens if you clicked an old or expired link, 
            or if you&apos;re on a different browser than where you requested the reset.
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-xs space-y-4 text-center">
        <h1 className="text-lg font-semibold">Confirming...</h1>
        <p className="text-sm text-muted-foreground">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
          <div className="w-full max-w-xs space-y-4 text-center">
            <h1 className="text-lg font-semibold">Loading...</h1>
          </div>
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}

