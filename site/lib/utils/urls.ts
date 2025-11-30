/**
 * Convert a video URL (YouTube, Vimeo, or iframe HTML) to an embed URL.
 * Handles various YouTube URL formats and extracts video IDs.
 */
export function toEmbedUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    // Accept full iframe HTML and extract its src
    if (/^\s*<iframe[\s\S]*?>/i.test(raw)) {
      const m = raw.match(/\ssrc=["']([^"']+)["']/i);
      if (m && m[1]) raw = m[1];
    }
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    // YouTube → embed
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) {
        id = u.pathname.replace(/^\//, '');
      } else if (u.pathname.startsWith('/watch')) {
        id = u.searchParams.get('v') ?? '';
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2] ?? '';
      } else if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.split('/')[2] ?? '';
      }
      if (id) {
        const params = new URLSearchParams();
        const start = u.searchParams.get('t') || u.searchParams.get('start');
        if (start) params.set('start', String(start).replace(/s$/i, ''));
        const query = params.toString();
        return `https://www.youtube-nocookie.com/embed/${id}${query ? `?${query}` : ''}`;
      }
    }
    // Vimeo → embed
    if (host.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Extract a brand name from a URL.
 * Converts a URL like "https://www.example.com" to "EXAMPLE".
 */
export function toBrand(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.') || u.hostname;
    const brand = host.split('-').join(' ').split('.').join(' ');
    return brand.toUpperCase();
  } catch {
    return null;
  }
}
