'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { usePixelImageEffect } from '@/app/hooks/usePixelImageEffect';

interface PixelImageWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}

/**
 * Wrapper component that applies pixelation effect to images.
 * Finds the img element within children and applies the pixel effect.
 * Only applies when inside a .retro-window element.
 */
export default function PixelImageWrapper({ children, enabled = true, className }: PixelImageWrapperProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef } = usePixelImageEffect(imageRef, { enabled });

  // Find the image element in children after render
  useEffect(() => {
    if (!containerRef.current) return;

    const findImage = (): HTMLImageElement | null => {
      // Try to find img element directly or within span (Next.js Image wraps in span)
      const img = containerRef.current?.querySelector('img');
      return img || null;
    };

    // Use MutationObserver to catch when Next.js Image renders the img
    const observer = new MutationObserver(() => {
      const img = findImage();
      if (img && img !== imageRef.current) {
        imageRef.current = img;
      }
    });

    // Initial check
    const img = findImage();
    if (img) {
      imageRef.current = img;
    }

    // Observe for changes
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [children]);

  // Check if we're inside a retro-window - disable if not
  // const isInsideRetroWindow = containerRef.current?.closest('.retro-window') !== null;
  // const shouldEnable = enabled && isInsideRetroWindow;

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

