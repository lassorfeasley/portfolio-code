'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import RetroWindow from '@/app/components/RetroWindow';
import { useInView, useReducedMotion } from '@/app/components/swiper/motion';
import LiveSite from './LiveSite';
import { featuredSites, type FeaturedSite } from './featuredSites';

type Props = {
  sites?: FeaturedSite[];
  // Delay between automatic page turns. Autoplay only visits sites that have a
  // native preview, so it never loads a third-party page on its own. 0 disables it.
  autoplayMs?: number;
};

// A full-width "browser" running on the LassorOS desktop. The browser chrome
// doubles as the carousel: Back/Forward turn between featured sites, the
// address bar links out, and Go swaps the native preview for the real page.
export default function FeaturedBrowserWindow({ sites = featuredSites, autoplayMs = 9000 }: Props) {
  const [index, setIndex] = useState(0);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const count = sites.length;
  const site = sites[index];
  const Page = site.Page;
  const showLive = live || !Page;
  const nativeCount = sites.filter((s) => s.Page).length;

  const turn = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
      setLive(false);
      setManual(true);
    },
    [count],
  );

  useEffect(() => {
    if (!autoplayMs || nativeCount < 2 || manual || paused || !inView || reduceMotion || showLive) return;
    const id = window.setTimeout(() => {
      setIndex((i) => {
        let next = i;
        do next = (next + 1) % count;
        while (!sites[next].Page);
        return next;
      });
    }, autoplayMs);
    return () => window.clearTimeout(id);
  }, [autoplayMs, nativeCount, manual, paused, inView, reduceMotion, showLive, index, count, sites]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') turn(-1);
    else if (event.key === 'ArrowRight') turn(1);
    else return;
    event.preventDefault();
  };

  return (
    <section className="windowcanvas featured" aria-label="Featured software">
      <div
        ref={ref}
        className="retro-window-placeholder featured wide"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={handleKeyDown}
      >
        <RetroWindow title={site.title} className="browser noratio" variant="nomax">
          <div className="browser-chrome">
            <button
              type="button"
              className="browser-chrome__nav"
              onClick={() => turn(-1)}
              disabled={count < 2}
              aria-label="Previous site"
              title="Back"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="browser-chrome__nav"
              onClick={() => turn(1)}
              disabled={count < 2}
              aria-label="Next site"
              title="Forward"
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
            <a
              className="browser-chrome__address"
              href={site.url}
              target="_blank"
              rel="noreferrer"
              title={`Open ${site.hostname} in a new tab`}
            >
              <i className="fa-solid fa-lock" aria-hidden="true" />
              <span className="browser-chrome__url">
                <span className="browser-chrome__scheme">https://</span>
                {site.hostname}
              </span>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            </a>
            {Page && (
              <button
                type="button"
                className="browser-chrome__nav browser-chrome__go"
                onClick={() => setLive((value) => !value)}
                aria-pressed={live}
                title={live ? 'Back to the preview' : `Load ${site.hostname} in this window`}
              >
                {live ? 'Stop' : 'Go'}
              </button>
            )}
            <span className="browser-chrome__count" aria-live="polite">
              {index + 1} / {count}
            </span>
          </div>
          <div className="browser-viewport" key={site.slug}>
            {showLive || !Page ? <LiveSite url={site.url} title={site.title} /> : <Page />}
          </div>
        </RetroWindow>
      </div>
    </section>
  );
}
