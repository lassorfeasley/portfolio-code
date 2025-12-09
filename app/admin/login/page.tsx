'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PanelsTopLeft } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type AuthState = 'idle' | 'submitting' | 'success' | 'error';
type ViewMode = 'login' | 'forgot-password' | 'enter-code' | 'new-password';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectCandidate = searchParams?.get('redirect') ?? '/admin';
  const redirectPath = useMemo(() => {
    return redirectCandidate.startsWith('/admin') ? redirectCandidate : '/admin';
  }, [redirectCandidate]);

  const searchError = searchParams?.get('error');

  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [status, setStatus] = useState<AuthState>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (searchError === 'unauthorized') {
      setStatus('error');
      setMessage('Your account does not have access to the admin dashboard.');
    } else if (searchError === 'no_code') {
      setStatus('error');
      setMessage('Password reset link is invalid - no authorization code received.');
    } else if (searchError === 'code_exchange_failed') {
      const errorMessage = searchParams?.get('message') || 'Unknown error';
      setStatus('error');
      setMessage(`Password reset failed: ${errorMessage}`);
    } else if (searchError === 'auth_callback_failed') {
      setStatus('error');
      setMessage('Password reset link is invalid or expired. Please request a new one.');
    }
  }, [searchError, searchParams]);

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

  const handleForgotPassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email) {
        setStatus('error');
        setMessage('Email is required.');
        return;
      }
      setStatus('submitting');
      setMessage('');
      const supabase = supabaseBrowser();
      // Use resetPasswordForEmail which sends a recovery OTP
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('success');
      setMessage('Check your email for a 6-digit code.');
      // Move to code entry view
      setTimeout(() => {
        setViewMode('enter-code');
        setStatus('idle');
        setMessage('');
      }, 1500);
    },
    [email]
  );

  const handleVerifyCode = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!otpCode || otpCode.length !== 6) {
        setStatus('error');
        setMessage('Please enter the 6-digit code from your email.');
        return;
      }
      setStatus('submitting');
      setMessage('');
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      });
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('success');
      setMessage('Code verified! Set your new password.');
      // Move to password reset view
      setTimeout(() => {
        setViewMode('new-password');
        setStatus('idle');
        setMessage('');
      }, 1000);
    },
    [email, otpCode]
  );

  const handleSetNewPassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!password) {
        setStatus('error');
        setMessage('Password is required.');
        return;
      }
      if (password !== confirmPassword) {
        setStatus('error');
        setMessage('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setStatus('error');
        setMessage('Password must be at least 6 characters.');
        return;
      }
      setStatus('submitting');
      setMessage('');
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('success');
      setMessage('Password updated! Redirecting to admin...');
      setTimeout(() => {
        router.replace('/admin');
        router.refresh();
      }, 1500);
    },
    [password, confirmPassword, router]
  );

  const getTitle = () => {
    switch (viewMode) {
      case 'login': return 'Admin access';
      case 'forgot-password': return 'Reset password';
      case 'enter-code': return 'Enter code';
      case 'new-password': return 'New password';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'login': return 'Enter your credentials to access the admin dashboard';
      case 'forgot-password': return 'Enter your email to receive a reset code';
      case 'enter-code': return `Enter the 6-digit code sent to ${email}`;
      case 'new-password': return 'Choose a new password for your account';
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <PanelsTopLeft className="h-6 w-6 text-primary" />
          <div>
            <p className="text-lg font-semibold leading-tight">Lassor Admin</p>
            <p className="text-xs text-muted-foreground">Sign in to manage your portfolio</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>
                {message && (
                  <p className={cn('text-sm', status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Signing in…' : 'Sign in'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password');
                    setStatus('idle');
                    setMessage('');
                    setPassword('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </form>
            )}

            {viewMode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                  />
                </div>
                {message && (
                  <p className={cn('text-sm', status === 'error' ? 'text-destructive' : 'text-green-600')}>
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Send reset code'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to login
                </button>
              </form>
            )}

            {viewMode === 'enter-code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                    required
                    disabled={status === 'submitting'}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                {message && (
                  <p className={cn('text-sm', status === 'error' ? 'text-destructive' : 'text-green-600')}>
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={status === 'submitting' || otpCode.length !== 6}>
                  {status === 'submitting' ? 'Verifying…' : 'Verify code'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot-password');
                    setStatus('idle');
                    setMessage('');
                    setOtpCode('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Send a new code
                </button>
              </form>
            )}

            {viewMode === 'new-password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                    minLength={6}
                  />
                </div>
                {message && (
                  <p className={cn('text-sm', status === 'error' ? 'text-destructive' : 'text-green-600')}>
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Return to Lassor.com
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Loading…</CardTitle>
              <CardDescription>Loading login form…</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
