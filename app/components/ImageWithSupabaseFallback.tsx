"use client";

import Image from 'next/image';
import { CSSProperties, useMemo, useState, useRef, useEffect } from 'react';
import { isSupabaseTransformedUrl, toOriginalObjectUrl } from '@/lib/supabase/image';
import { usePixelImageEffect } from '@/app/hooks/usePixelImageEffect';

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'eager' | 'lazy';
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  pixelate?: boolean;
};

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 900;

export default function ImageWithSupabaseFallback({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  sizes = '100vw',
  priority = false,
  unoptimized = true,
  pixelate = true,
}: Props) {
  const initial = useMemo(() => src, [src]);
  const [currentSrc, setCurrentSrc] = useState(initial);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldPixelate = pixelate && !className?.includes('no-pixelate');

  const { canvasRef, isFinished, isPrepared, effectSkipped } = usePixelImageEffect(imageRef, { enabled: shouldPixelate });
  
  // Determine if we should hide the original image
  // Hide if: effect is enabled AND effect hasn't finished AND effect wasn't skipped
  const shouldHideImage = shouldPixelate && !isFinished && !effectSkipped;

  // Ensure imageRef points to the actual img rendered by Next.js Image
  useEffect(() => {
    if (!containerRef.current) return;

    const findImage = (): HTMLImageElement | null => {
      return containerRef.current?.querySelector('img') || null;
    };

    const img = findImage();
    if (img) {
      imageRef.current = img;
    }

    const observer = new MutationObserver(() => {
      const nextImg = findImage();
      if (nextImg && nextImg !== imageRef.current) {
        imageRef.current = nextImg;
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${width} / ${height}`,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        unoptimized={unoptimized}
        crossOrigin="anonymous"
        onError={() => {
          if (isSupabaseTransformedUrl(currentSrc)) {
            setCurrentSrc(toOriginalObjectUrl(currentSrc));
          }
        }}
        style={{
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          // Hide image while pixel effect is active
          opacity: shouldHideImage ? 0 : 1,
        }}
      />
      {shouldPixelate && (
        <canvas
          ref={canvasRef}
          data-pixel-canvas="true"
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
