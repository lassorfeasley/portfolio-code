import { createSupabaseServerClient } from '@/lib/supabase/helpers';
import type { TypedSupabaseClient } from '@/lib/supabase/types';

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export function supabaseServiceRole(): TypedSupabaseClient {
  if (!url) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL env var');
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  }

  return createSupabaseServerClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function withServiceRole<T>(
  handler: (client: TypedSupabaseClient) => Promise<T>
): Promise<T> {
  const client = supabaseServiceRole();
  return handler(client);
}
