'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Cleans up any orphaned elements from the float layer on route changes.
 * This prevents windows from persisting across page navigations.
 */
export function RouteCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // Clean up float layer on route change
    const floatLayer = document.getElementById('window-float-layer');
    if (floatLayer) {
      // Remove all children
      while (floatLayer.firstChild) {
        floatLayer.removeChild(floatLayer.firstChild);
      }
      // Optionally remove the float layer itself
      floatLayer.remove();
    }
  }, [pathname]);

  return null;
}

