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
type ViewMode = 'login' | 'forgot-password';

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
      });
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('success');
      setMessage('Password reset email sent! Check your inbox.');
    },
    [email]
  );

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
            <CardTitle>{viewMode === 'login' ? 'Admin access' : 'Reset password'}</CardTitle>
            <CardDescription>
              {viewMode === 'login'
                ? 'Enter your credentials to access the admin dashboard'
                : 'Enter your email to receive a password reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'login' ? (
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
                  <p
                    className={cn(
                      'text-sm',
                      status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
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
            ) : (
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
                  <p
                    className={cn(
                      'text-sm',
                      status === 'error' ? 'text-destructive' : 'text-success'
                    )}
                  >
                    {message}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Send reset link'}
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

