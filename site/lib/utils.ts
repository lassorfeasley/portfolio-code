import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export utility functions for convenience
export { hasSupabaseEnv } from './utils/env';
export { toEmbedUrl, toBrand } from './utils/urls';

