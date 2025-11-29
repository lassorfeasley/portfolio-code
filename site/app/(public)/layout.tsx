import type { ReactNode } from 'react';
import Script from 'next/script';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script src="/js/retro-window-state.js?v=1" strategy="afterInteractive" />
      <Script src="/js/retro-scatter-engine.js?v=1" strategy="afterInteractive" />
      <Script src="/js/core-effects.js?v=2" strategy="afterInteractive" />
      <Script src="/js/visual-effects.js?v=2" strategy="afterInteractive" />
      <div className="public-body">{children}</div>
    </>
  );
}


