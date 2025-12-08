'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { usePixelImageEffect } from '@/app/hooks/usePixelImageEffect';

interface PixelImageWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
  aspectRatio?: number;
}

/**
 * Wrapper component that applies pixelation effect to images.
 * Assumes children render an <img>. Owns layout via aspect-ratio + absolute positioning.
 */
export default function PixelImageWrapper({ children, enabled = true, className, aspectRatio }: PixelImageWrapperProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { canvasRef } = usePixelImageEffect(imageRef, { enabled });

  useEffect(() => {
    if (!containerRef.current) return;

    const findImage = (): HTMLImageElement | null => {
      return containerRef.current?.querySelector('img') || null;
    };

    const observer = new MutationObserver(() => {
      const img = findImage();
      if (img && img !== imageRef.current) {
        imageRef.current = img;
      }
    });

    const img = findImage();
    if (img) {
      imageRef.current = img;
    }

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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        overflow: 'hidden',
      }}
    >
      {children}
      {enabled && (
        <canvas
          ref={canvasRef}
          suppressHydrationWarning
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}

