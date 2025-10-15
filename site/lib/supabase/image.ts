/** Utilities for generating transformed (resized/compressed) Supabase Storage image URLs.
 *
 * Supabase public file URLs typically look like:
 *   https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * The corresponding Image Transformation endpoint is:
 *   https://<project-ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=...&height=...&quality=...&format=webp
 */

export type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png';
};

export function isSupabaseStoragePublicUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /\/storage\/v1\/object\//.test(u.pathname);
  } catch {
    return false;
  }
}

export function isSupabaseTransformedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /\/storage\/v1\/render\/image\//.test(u.pathname);
  } catch {
    return false;
  }
}

export function toOriginalObjectUrl(url: string): string {
  try {
    const u = new URL(url);
    if (/\/storage\/v1\/render\/image\//.test(u.pathname)) {
      u.pathname = u.pathname.replace('/storage/v1/render/image/', '/storage/v1/object/');
      u.search = '';
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function toSupabaseTransformedUrl(url: string, opts: ImageTransformOptions = {}): string {
  if (!isSupabaseStoragePublicUrl(url)) return url;
  const { width, height, quality = 82, format = 'webp' } = opts;
  // Convert object → render/image path while preserving bucket/path
  // /storage/v1/object/public/...  →  /storage/v1/render/image/public/...
  const renderUrl = url.replace('/storage/v1/object/', '/storage/v1/render/image/');
  const u = new URL(renderUrl);
  if (width) u.searchParams.set('width', String(width));
  if (height) u.searchParams.set('height', String(height));
  if (quality) u.searchParams.set('quality', String(quality));
  if (format) u.searchParams.set('format', format);
  // Hint: cover maintains aspect when both width/height provided; leave default if only width
  return u.toString();
}

/** Provide a conservative default for thumbnails */
export function toThumbUrl(url: string, maxWidth = 600, quality = 85): string {
  return toSupabaseTransformedUrl(url, { width: maxWidth, quality, format: 'webp' });
}

/** Provide a conservative default for lightbox/featured */
export function toLargeUrl(url: string, maxWidth = 1600): string {
  return toSupabaseTransformedUrl(url, { width: maxWidth, quality: 85, format: 'webp' });
}


