'use client';

import { useElementSize } from './useElementSize';

// The real site, rendered at a desktop width (or a phone width when the window
// is narrow) and scaled to fit the browser viewport. The frame is purely
// visual: pointer events are off so it never captures scrolling or window
// drags, and a link overlay opens the site.
export default function LiveSite({ url, title }: { url: string; title: string }) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const pageWidth = width < 640 ? 430 : 1280;
  const scale = width > 0 ? width / pageWidth : 1;
  return (
    <div ref={ref} className="featured-live">
      {width > 0 && (
        <iframe
          src={url}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          style={{ width: pageWidth, height: height / scale, transform: `scale(${scale})` }}
        />
      )}
      <a className="featured-live__overlay" href={url} target="_blank" rel="noreferrer" aria-label={`Open ${title}`} />
    </div>
  );
}
