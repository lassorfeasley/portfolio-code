'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthWindow } from '../../components/AuthWindow';
import { useAuthFormState } from '../../hooks';

export default function ResetPasswordPage() {
  const { supabase, status, message, setError, submit } = useAuthFormState();
  const [email, setEmail] = useState('');

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/update-password`;
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email) {
        setError('Email is required.');
        return;
      }

      const result = await submit(
        () =>
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          }),
        {
          successMessage: 'Check your email for a secure link to reset your password.',
        }
      );

      if (!result.ok) {
        console.error(result.error);
      }
    },
    [email, redirectTo, setError, submit, supabase]
  );

  return (
    <AuthWindow
      title="Reset password"
      description="Send yourself a secure link to choose a new password."
      footer={
        <div className="h _5 link">
          Remember it now?{' '}
          <Link href="/auth/login" className="link h _5">
            Go back to sign in
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
        <button type="submit" className="button w-button" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending link…' : 'Send reset link'}
        </button>
        {message ? <p className="paragraph">{message}</p> : null}
      </form>
    </AuthWindow>
  );
}



