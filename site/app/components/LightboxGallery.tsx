"use client";

import { useCallback, useEffect, useState } from 'react';
import { toLargeUrl, toThumbUrl, toOriginalObjectUrl, isSupabaseTransformedUrl } from '@/lib/supabase/image';
import { createPortal } from 'react-dom';

type LightboxGalleryProps = {
  images: string[];
  itemClassName?: string;
  linkClassName?: string;
};

export default function LightboxGallery({
  images,
  itemClassName = 'collection-item w-dyn-item w-dyn-repeater-item',
  linkClassName = 'lightbox-link w-inline-block',
}: LightboxGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = useCallback((i: number) => { setIndex(i); setOpen(true); }, []);
  const hide = useCallback(() => setOpen(false), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, hide, next, prev]);

  if (!Array.isArray(images) || images.length === 0) return null;

  return (
    <>
      <div className="collection-list w-dyn-items">
        {images.map((url, i) => {
          // Sharper thumbnails to reduce visible pixelation while still smaller than full
          const thumb = toThumbUrl(url, 1000, 88);
          return (
            <div key={i} className={itemClassName}>
              <a href="#" className={linkClassName} onClick={(e) => { e.preventDefault(); show(i); }} aria-label="Open image">
                <div className="thumb-frame">
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (isSupabaseTransformedUrl(img.currentSrc || img.src)) {
                        img.src = toOriginalObjectUrl(img.currentSrc || img.src);
                      }
                    }}
                    className="cover-object"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </a>
            </div>
          );
        })}
      </div>

      {open ? createPortal((
        <div
          role="dialog"
          aria-modal="true"
          className="lf-lightbox-backdrop"
          onClick={(e) => { if (e.currentTarget === e.target) hide(); }}
        >
          <button className="lf-lightbox-close" aria-label="Close" onClick={hide}>×</button>
          <button className="lf-lightbox-prev" aria-label="Previous" onClick={prev}>‹</button>
          <img
            className="lf-lightbox-img"
            src={toLargeUrl(images[index], 2200)}
            alt=""
            className="lf-lightbox-img no-pixelate"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (isSupabaseTransformedUrl(img.currentSrc || img.src)) {
                img.src = toOriginalObjectUrl(img.currentSrc || img.src);
              }
            }}
          />
          <button className="lf-lightbox-next" aria-label="Next" onClick={next}>›</button>

          <style jsx>{`
            .lf-lightbox-backdrop {
              position: fixed; inset: 0; background: rgba(0,0,0,0.92);
              display: grid; place-items: center; z-index: 2147483000;
            }
            .lf-lightbox-img {
              max-width: min(92vw, 1600px); max-height: 90vh;
              box-shadow: 0 0 24px rgba(0,0,0,0.6);
            }
            .lf-lightbox-close, .lf-lightbox-prev, .lf-lightbox-next {
              position: absolute; background: rgba(255,255,255,0.08);
              color: #fff; border: 1px solid rgba(255,255,255,0.25);
              border-radius: 6px; padding: 6px 10px; font-size: 22px; line-height: 1;
              cursor: pointer; backdrop-filter: saturate(110%) blur(2px);
            }
            .lf-lightbox-close { top: 16px; right: 16px; }
            .lf-lightbox-prev { top: 50%; left: 16px; transform: translateY(-50%); }
            .lf-lightbox-next { top: 50%; right: 16px; transform: translateY(-50%); }
            @media (hover:hover) {
              .lf-lightbox-close:hover, .lf-lightbox-prev:hover, .lf-lightbox-next:hover {
                background: rgba(255,255,255,0.18);
              }
            }
          `}</style>
        </div>
      ), document.body) : null}
    </>
  );
}


