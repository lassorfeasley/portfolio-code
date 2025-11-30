import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

type Schema = 'public';

export function createSupabaseServerClient(
  url: string,
  key: string,
  options?: SupabaseClientOptions<Schema>
) {
  return createClient<Database>(url, key, options);
}

export function createSupabaseBrowserClient(
  url: string,
  key: string,
  options?: SupabaseClientOptions<Schema>
) {
  return createBrowserClient<Database>(url, key, options);
}
