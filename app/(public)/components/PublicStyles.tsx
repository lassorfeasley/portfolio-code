'use client';

import { useEffect } from 'react';

export function PublicStyles() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if stylesheets are already loaded to avoid duplicates
    const stylesheets = [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
      '/css/webflow-shared.css',
      '/css/pixel-effect-styling.css',
      '/css/retro-window-lightbox-styling.css',
      '/css/scroll-bars.css',
    ];

    const loadedLinks: HTMLLinkElement[] = [];

    stylesheets.forEach((href) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (href.startsWith('http')) {
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
      }
      document.head.appendChild(link);
      loadedLinks.push(link);
    });

    // Cleanup function
    return () => {
      loadedLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, []);

  return null;
}

