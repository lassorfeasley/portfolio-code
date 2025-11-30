"use client";

import Image from 'next/image';
import { CSSProperties, useMemo, useState } from 'react';
import { isSupabaseTransformedUrl, toOriginalObjectUrl } from '@/lib/supabase/image';

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

  return (
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
      onError={() => {
        if (isSupabaseTransformedUrl(currentSrc)) {
          setCurrentSrc(toOriginalObjectUrl(currentSrc));
        }
      }}
    />
  );
}
