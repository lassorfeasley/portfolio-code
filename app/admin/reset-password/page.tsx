'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PanelsTopLeft } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type AuthState = 'idle' | 'submitting' | 'success' | 'error';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<AuthState>('idle');
  const [message, setMessage] = useState<string>('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session (from the reset link)
    const checkSession = async () => {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidToken(!!session);
    };
    checkSession();
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      
      if (!password || !confirmPassword) {
        setStatus('error');
        setMessage('Please fill in all fields.');
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      setStatus('success');
      setMessage('Password updated successfully! Redirecting to admin...');
      
      setTimeout(() => {
        router.replace('/admin');
        router.refresh();
      }, 2000);
    },
    [password, confirmPassword, router]
  );

  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-xs">
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
            <CardDescription>Verifying reset link…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-xs space-y-6">
          <div className="flex items-center gap-2 justify-center">
            <PanelsTopLeft className="h-6 w-6 text-primary" />
            <div>
              <p className="text-lg font-semibold leading-tight">Lassor Admin</p>
              <p className="text-xs text-muted-foreground">Password Reset</p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Invalid or expired link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/admin/login')} 
                className="w-full"
              >
                Return to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <PanelsTopLeft className="h-6 w-6 text-primary" />
          <div>
            <p className="text-lg font-semibold leading-tight">Lassor Admin</p>
            <p className="text-xs text-muted-foreground">Set new password</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={status === 'submitting' || status === 'success'}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={status === 'submitting' || status === 'success'}
                  minLength={6}
                />
              </div>
              {message && (
                <p
                  className={cn(
                    'text-sm',
                    status === 'error' ? 'text-destructive' : 'text-green-600'
                  )}
                >
                  {message}
                </p>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={status === 'submitting' || status === 'success'}
              >
                {status === 'submitting' ? 'Updating…' : status === 'success' ? 'Success!' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Loading…</CardTitle>
              <CardDescription>Loading reset form…</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

