/* === Swap Supabase transformed image URLs to original object URLs on error (400/403/etc.) === */
(function () {
  function toOriginalUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      if (!/\/storage\/v1\/render\/image\//.test(u.pathname)) return url;
      u.pathname = u.pathname.replace('/storage/v1/render/image/', '/storage/v1/object/');
      u.search = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  function isTransformed(url) {
    try { return /\/storage\/v1\/render\/image\//.test(new URL(url, location.href).pathname); }
    catch { return false; }
  }

  // Global error handler for <img> loads
  window.addEventListener('error', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLImageElement)) return;
    const src = target.currentSrc || target.src || '';
    if (!isTransformed(src)) return;
    const fallback = toOriginalUrl(src);
    if (fallback && fallback !== src) {
      // Prevent infinite loops
      target.onerror = null;
      target.crossOrigin = '';
      target.src = fallback;
    }
  }, true);
})();

