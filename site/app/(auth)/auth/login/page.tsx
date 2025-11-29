'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthWindow } from '../../components/AuthWindow';
import { safeRedirectPath, useAuthFormState } from '../../hooks';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectCandidate = searchParams?.get('redirect') ?? '/';
  const redirectPath = useMemo(() => safeRedirectPath(redirectCandidate, '/'), [redirectCandidate]);

  const { supabase, status, message, setError, setSuccess, submit } = useAuthFormState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error === 'unauthorized') {
      setError('Please sign in with an account that has access.');
    } else if (error === 'session_expired') {
      setError('Your session expired. Please sign in again.');
    }
  }, [searchParams, setError]);

  useEffect(() => {
    const msg = searchParams?.get('message');
    if (msg === 'password-updated') {
      setSuccess('Password updated. You can sign in now.');
    }
  }, [searchParams, setSuccess]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email || !password) {
        setError('Email and password are required.');
        return;
      }
      const result = await submit(
        () => supabase.auth.signInWithPassword({ email, password }),
        {
          successMessage: 'Signed in! Redirecting…',
          onSuccess: () => {
            router.replace(redirectPath);
            router.refresh();
          },
        }
      );

      if (!result.ok) {
        console.error(result.error);
      }
    },
    [email, password, redirectPath, router, setError, submit, supabase]
  );

  return (
    <AuthWindow
      title="Sign in"
      description="Access saved work, drafts, and community features."
      footer={
        <div className="h _5 link">
          Need an account?{' '}
          <Link href="/auth/create-account" className="link h _5">
            Create one
          </Link>
        </div>
      }
    >
      <form className="v _15" onSubmit={handleSubmit}>
        <label className="v _5">
          <span>Email</span>
          <input
            type="email"
            className="text-field w-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="v _5">
          <span>Password</span>
          <input
            type="password"
            className="text-field w-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="button w-button" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="h _5 link">
          <Link href="/auth/reset-password">Forgot your password?</Link>
        </div>
        {message ? <p className="paragraph">{message}</p> : null}
      </form>
    </AuthWindow>
  );
}



