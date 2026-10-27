import type { ComponentType } from 'react';
import SwiperPage from './SwiperPage';

export type FeaturedSite = {
  slug: string;
  // Window title, matching the other project windows on the desktop.
  title: string;
  // What the address bar shows.
  hostname: string;
  // Where the address bar (and the live frame) go.
  url: string;
  // Native preview drawn inside the browser. When absent, the live site is
  // framed instead.
  Page?: ComponentType;
};

// Order is carousel order. Hardcoded for now; move to the admin alongside
// hero-content / folder-links once featured software gets its own page type.
export const featuredSites: FeaturedSite[] = [
  {
    slug: 'swiper-fit',
    title: 'Swiper.Fit',
    hostname: 'swiper.fit',
    url: 'https://www.swiper.fit/',
    Page: SwiperPage,
  },
  {
    slug: 'renewables',
    title: 'Renewables.org',
    hostname: 'renewables.org',
    url: 'https://www.renewables.org/',
  },
  {
    slug: 'gracious-host',
    title: 'Gracious.Host',
    hostname: 'gracious.host',
    url: 'https://gracious.host/',
  },
];
