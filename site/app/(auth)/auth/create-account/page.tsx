'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthWindow } from '../../components/AuthWindow';
import { useAuthFormState } from '../../hooks';

export default function CreateAccountPage() {
  const router = useRouter();
  const { supabase, status, message, setError, submit } = useAuthFormState();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const emailRedirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/login`;
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords must match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      const metadata = name ? { full_name: name } : undefined;
      const result = await submit(
        () =>
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo,
            },
          }),
        {
          successMessage: 'Check your email for a verification link to finish signing up.',
          onSuccess: () => {
            setPassword('');
            setConfirmPassword('');
            router.prefetch('/auth/login');
          },
        }
      );

      if (!result.ok) {
        console.error(result.error);
      }
    },
    [confirmPassword, email, emailRedirectTo, name, router, setError, submit, supabase, password]
  );

  return (
    <AuthWindow
      title="Create account"
      description="Set up your Lassor.com account to save project drafts and sync your work."
      footer={
        <div className="h _5 link">
          Already have an account?{' '}
          <Link href="/auth/login" className="link h _5">
            Sign in
          </Link>
        </div>
      }
    >
      <form className="v _15" onSubmit={handleSubmit}>
        <label className="v _5">
          <span>Full name (optional)</span>
          <input
            type="text"
            className="text-field w-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Lassor Feasley"
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="v _5">
          <span>Confirm password</span>
          <input
            type="password"
            className="text-field w-input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="Repeat password"
          />
        </label>
        <button type="submit" className="button w-button" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Creating account…' : 'Create account'}
        </button>
        {message ? <p className="paragraph">{message}</p> : null}
      </form>
    </AuthWindow>
  );
}



