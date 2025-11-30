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
}: Props) {
  const initial = useMemo(() => src, [src]);
  const [currentSrc, setCurrentSrc] = useState(initial);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check for data attribute on ancestor (survives DOM manipulation)
  const [isPixelEffectEnabled, setIsPixelEffectEnabled] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Look for ancestor with data-pixel-effect-enabled="true"
    // This works even if the element has been moved by float system
    const checkPixelEffect = () => {
      const retroWindow = containerRef.current?.closest('[data-pixel-effect-enabled="true"]');
      setIsPixelEffectEnabled(retroWindow !== null);
    };
    
    checkPixelEffect();
    
    // Recheck after a delay to catch floated windows
    const timeoutId = setTimeout(checkPixelEffect, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Find the actual img element after Next.js Image renders it
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

    return () => observer.disconnect();
  }, []);

  // Only enable pixel effect if context allows and not opted out
  const shouldPixelate = isPixelEffectEnabled && !className?.includes('no-pixelate');
  const { canvasRef } = usePixelImageEffect(imageRef, { enabled: shouldPixelate });

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Image
        src={currentSrc}
        alt={alt}
        className={className}
        style={style}
        width={width}
        height={height}
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
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
