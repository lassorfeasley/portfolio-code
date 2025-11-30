/**
 * Check if Supabase environment variables are configured.
 * Used to gracefully handle missing env vars in development.
 */
export function hasSupabaseEnv(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL
  );
}
