'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
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
  const { canvasRef, isFinished, isPrepared, effectSkipped } = usePixelImageEffect(imageRef, { enabled });
  
  // Determine if we should hide the original image
  // Hide if: effect is enabled AND effect hasn't finished AND effect wasn't skipped
  const shouldHideImage = enabled && !isFinished && !effectSkipped;

  // Track when image ref changes to trigger visibility update
  const [imageFound, setImageFound] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const findImage = (): HTMLImageElement | null => {
      return containerRef.current?.querySelector('img') || null;
    };

    const observer = new MutationObserver(() => {
      const img = findImage();
      if (img && img !== imageRef.current) {
        imageRef.current = img;
        setImageFound(true);
      }
    });

    const img = findImage();
    if (img) {
      imageRef.current = img;
      setImageFound(true);
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

  // Effect to control image visibility based on pixelation state
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    if (shouldHideImage) {
      // Hide the original image while canvas shows the pixelation effect
      img.style.opacity = '0';
    } else {
      // Show the original image when effect is complete or skipped
      img.style.opacity = '1';
    }
  }, [shouldHideImage, imageFound]);

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
            // Only show canvas when prepared and not finished
            opacity: isPrepared && !isFinished ? 1 : 0,
            visibility: isPrepared && !isFinished ? 'visible' : 'hidden',
          }}
        />
      )}
    </div>
  );
}

