import { createSupabaseServerClient } from '@/lib/supabase/helpers';
import type { TypedSupabaseClient } from '@/lib/supabase/types';

export function supabaseServer(): TypedSupabaseClient {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string;
  const key = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }
  return createSupabaseServerClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
