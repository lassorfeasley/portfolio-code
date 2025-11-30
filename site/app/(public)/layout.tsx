import type { ReactNode } from 'react';
import Script from 'next/script';
import { PublicStyles } from './components/PublicStyles';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

const guardCss = `
.globalmargin{max-width:1500px;margin:0 auto;padding:40px 40px 80px;}
.public-body{overflow-x:hidden;}
@media(max-width:768px){.globalmargin{padding:40px 20px 80px;}}
`;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <PublicStyles />
      <style dangerouslySetInnerHTML={{ __html: guardCss }} />
      <Script src="/js/retro-window-state.js?v=1" strategy="afterInteractive" />
      <Script src="/js/retro-scatter-engine.js?v=1" strategy="afterInteractive" />
      <Script src="/js/core-effects.js?v=2" strategy="afterInteractive" />
      <Script src="/js/visual-effects.js?v=4" strategy="afterInteractive" />
      <div className="public-body">{children}</div>
    </ErrorBoundary>
  );
}


