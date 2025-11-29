'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';

type AuthState = 'idle' | 'submitting' | 'success' | 'error';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectCandidate = searchParams?.get('redirect') ?? '/admin';
  const redirectPath = useMemo(() => {
    return redirectCandidate.startsWith('/admin') ? redirectCandidate : '/admin';
  }, [redirectCandidate]);

  const searchError = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AuthState>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (searchError === 'unauthorized') {
      setStatus('error');
      setMessage('Your account does not have access to the admin dashboard.');
    }
  }, [searchError]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email || !password) {
        setStatus('error');
        setMessage('Email and password are required.');
        return;
      }
      setStatus('submitting');
      setMessage('');
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('success');
      setMessage('Redirecting…');
      router.replace(redirectPath);
      router.refresh();
    },
    [email, password, redirectPath, router]
  );

  return (
    <main className="retro-root">
      <div className="globalmargin">
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block">
            <div>Lassor.com</div>
            <div>→</div>
          </Link>
          <div className="h _5 link"><div>Admin login</div></div>
        </div>
        <div className="windowcanvas">
          <div className="retro-window-placeholder">
            <div className="retro-window">
              <div className="window-bar">
                <div className="x-out" />
                <div className="window-title">Admin access</div>
              </div>
              <div className="window-content">
                <form className="v _20" onSubmit={handleSubmit}>
                  <label className="v _5">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="text-field w-input"
                    />
                  </label>
                  <label className="v _5">
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="text-field w-input"
                    />
                  </label>
                  <button
                    type="submit"
                    className="button w-button"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Signing in…' : 'Sign in'}
                  </button>
                  {message ? <p className="paragraph">{message}</p> : null}
                </form>
              </div>
              <div className="resize-corner" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

