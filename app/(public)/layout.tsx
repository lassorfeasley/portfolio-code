import type { ReactNode } from 'react';
import Script from 'next/script';
import { PublicStyles } from './components/PublicStyles';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { RouteCleanup } from './components/RouteCleanup';

const guardCss = `
.globalmargin{max-width:1500px;margin:0 auto;padding:40px 40px 80px;}
.public-body{overflow-x:hidden;}
@media(max-width:768px){.globalmargin{padding:40px 20px 80px;}}
`;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <RouteCleanup />
      <PublicStyles />
      <style dangerouslySetInnerHTML={{ __html: guardCss }} />
      <Script src="/js/retro-window-state.js?v=1" strategy="afterInteractive" />
      <Script src="/js/retro-scatter-engine.js?v=1" strategy="afterInteractive" />
      <Script src="/js/core-effects.js?v=2" strategy="afterInteractive" />
      <Script src="/js/visual-effects.js?v=9" strategy="afterInteractive" />
      <Script src="/js/drag-and-drop-icons.js?v=1" strategy="afterInteractive" />
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "r65yzd1emd");`}
      </Script>
      <div className="public-body">{children}</div>
    </ErrorBoundary>
  );
}
