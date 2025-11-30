import { useCallback, useMemo, useState } from 'react';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

export type AuthStatus = 'idle' | 'submitting' | 'success' | 'error';

type SupabaseError = Pick<AuthError | PostgrestError, 'message'> | null;

type SubmitOptions<T> = {
  successMessage?: string;
  onSuccess?: (data: T | undefined) => void | Promise<void>;
};

type SubmitResult<T> =
  | { ok: true; data: T | undefined }
  | { ok: false; error: SupabaseError | Error };

export function useAuthFormState(initialMessage = '') {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [message, setMessage] = useState(initialMessage);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage(initialMessage);
  }, [initialMessage]);

  const submit = useCallback(
    async <T>(
      action: () => Promise<{ data?: T; error: SupabaseError }>,
      options: SubmitOptions<T> = {}
    ): Promise<SubmitResult<T>> => {
      setStatus('submitting');
      setMessage('');
      try {
        const { data, error } = await action();
        if (error) {
          setStatus('error');
          setMessage(error.message);
          return { ok: false, error };
        }
        setStatus('success');
        if (options.successMessage) {
          setMessage(options.successMessage);
        } else {
          setMessage('');
        }
        if (options.onSuccess) {
          await options.onSuccess(data);
        }
        return { ok: true, data };
      } catch (error) {
        const fallback =
          error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        setStatus('error');
        setMessage(fallback);
        return { ok: false, error: error instanceof Error ? error : new Error(fallback) };
      }
    },
    []
  );

  const setError = useCallback((text: string) => {
    setStatus('error');
    setMessage(text);
  }, []);

  const setSuccess = useCallback((text: string) => {
    setStatus('success');
    setMessage(text);
  }, []);

  return {
    supabase,
    status,
    message,
    setMessage,
    reset,
    setError,
    setSuccess,
    submit,
  };
}

export function safeRedirectPath(candidate: string | null, fallback = '/') {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.startsWith('/admin')) return fallback;
  return candidate;
}


