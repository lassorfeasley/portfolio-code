import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('Missing Supabase env vars for SSR client');
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function wrapCookieStore(target: CookieStore) {
  return {
    get(name: string) {
      return target.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions = {}) {
      target.set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions = {}) {
      target.delete({ name, ...options });
    },
  };
}

export async function supabaseServerAuth() {
  const store = await cookies();
  return createServerClient(url, anonKey, { cookies: wrapCookieStore(store) });
}


