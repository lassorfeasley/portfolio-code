'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthWindow } from '../../components/AuthWindow';
import { useAuthFormState } from '../../hooks';

type RecoveryStatus = 'checking' | 'ready' | 'missing';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { supabase, status, message, setError, submit } = useAuthFormState();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('checking');

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        if (data.session) {
          setRecoveryStatus('ready');
        } else {
          setRecoveryStatus('missing');
        }
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setRecoveryStatus('missing');
        }
      });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (recoveryStatus !== 'ready') {
        setError('Your reset link has expired. Please request a new one.');
        return;
      }
      if (!password || !confirmPassword) {
        setError('Both password fields are required.');
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

      const result = await submit(
        () => supabase.auth.updateUser({ password }),
        {
          successMessage: 'Password updated! Redirecting to sign in…',
          onSuccess: async () => {
            await supabase.auth.signOut();
            router.replace('/auth/login?message=password-updated');
            router.refresh();
          },
        }
      );

      if (!result.ok) {
        console.error(result.error);
      }
    },
    [confirmPassword, password, recoveryStatus, router, setError, submit, supabase]
  );

  const renderContent = () => {
    if (recoveryStatus === 'checking') {
      return <p className="paragraph">Checking your recovery link…</p>;
    }
    if (recoveryStatus === 'missing') {
      return (
        <div className="v _15">
          <p className="paragraph">
            This page is only available after you request a password reset email. Start over and
            you&apos;ll get a fresh link.
          </p>
          <Link href="/auth/reset-password" className="h _5 link">
            Request a new reset link
          </Link>
        </div>
      );
    }
    return (
      <form className="v _15" onSubmit={handleSubmit}>
        <label className="v _5">
          <span>New password</span>
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
          <span>Confirm new password</span>
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
          {status === 'submitting' ? 'Updating password…' : 'Update password'}
        </button>
        {message ? <p className="paragraph">{message}</p> : null}
      </form>
    );
  };

  return (
    <AuthWindow
      title="Set a new password"
      description="Choose a strong password to keep your account secure."
      footer={
        <div className="h _5 link">
          <Link href="/auth/login" className="link h _5">
            Back to sign in
          </Link>
        </div>
      }
    >
      {renderContent()}
    </AuthWindow>
  );
}



