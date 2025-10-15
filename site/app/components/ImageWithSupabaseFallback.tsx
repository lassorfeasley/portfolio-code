"use client";

import { CSSProperties, useMemo, useState } from 'react';
import { isSupabaseTransformedUrl, toOriginalObjectUrl } from '@/lib/supabase/image';

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'eager' | 'lazy';
};

export default function ImageWithSupabaseFallback({ src, alt, className, style, loading = 'lazy' }: Props) {
  const initial = useMemo(() => src, [src]);
  const [currentSrc, setCurrentSrc] = useState(initial);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={() => {
        if (isSupabaseTransformedUrl(currentSrc)) {
          setCurrentSrc(toOriginalObjectUrl(currentSrc));
        }
      }}
    />
  );
}


