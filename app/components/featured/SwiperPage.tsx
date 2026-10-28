'use client';

import { Be_Vietnam_Pro } from 'next/font/google';
import HeroCheck from '@/app/components/swiper/HeroCheck';
import HeroPhone from '@/app/components/swiper/HeroPhone';
import WatchSwipe from '@/app/components/swiper/WatchSwipe';
import { useElementSize } from './useElementSize';

const beVietnamPro = Be_Vietnam_Pro({ subsets: ['latin'], weight: ['400', '600'], display: 'swap' });

export const SWIPER_APP_STORE_URL = 'https://apps.apple.com/us/app/swiper-fit/id6757280268';

// The swiper.fit hero, re-laid-out for the browser window: copy on the left,
// the live iPhone tour on the right with the Apple Watch tucked beside it.
// Device scale follows the page width so the phone fills the viewport at any
// window size (the user can resize the window).
export default function SwiperPage() {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const narrow = width > 0 && width < 640;
  const phoneScale = width ? Math.min(0.58, Math.max(0.34, width / 1750)) : 0.5;

  return (
    <div ref={ref} className={`swiper-page ${beVietnamPro.className}`}>
      <HeroCheck vertex={[820, 860]} thickness={600} />
      <div className="swiper-page__grid">
        <div className="swiper-page__copy">
          <h2 className="swiper-page__headline">Log workouts effortlessly.</h2>
          <p className="swiper-page__sub">
            Enter your routine and start a workout. Never miss an exercise and track your progress over time, on
            iPhone and Apple Watch.
          </p>
          <a className="swiper-page__cta" href={SWIPER_APP_STORE_URL} target="_blank" rel="noreferrer">
            <i className="fa-brands fa-apple" aria-hidden="true" />
            Download on the App Store
          </a>
        </div>
        <div className="swiper-page__devices">
          {width > 0 && (
            <>
              <HeroPhone scale={phoneScale} className="swiper-page__phone" />
              {!narrow && <WatchSwipe scale={phoneScale * 0.62} roll={6} className="swiper-page__watch" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
