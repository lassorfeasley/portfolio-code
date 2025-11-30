import { createSupabaseBrowserClient } from '@/lib/supabase/helpers';
import type { TypedSupabaseClient } from '@/lib/supabase/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('Missing Supabase browser env vars');
}

export const supabaseBrowser = (): TypedSupabaseClient => createSupabaseBrowserClient(url, anonKey);


