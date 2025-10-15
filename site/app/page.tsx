import fs from 'node:fs';
import path from 'node:path';
import Script from 'next/script';

const webflowHtml = fs.readFileSync(path.join(process.cwd(), 'public/webflow/index.html'), 'utf-8');
const originalBody = webflowHtml.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)?.[1] ?? '';

function rewriteHomepageLinks(html: string): string {
  return html
    // Projects → /work/[slug]
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/projects\/([a-z0-9-]+)/gi, '/work/$1')
    // Project types → /project-types/[slug]
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/project-types\/([a-z0-9-]+)/gi, '/project-types/$1')
    // Legacy webflow.io links
    .replace(/https?:\/\/lassorfeasley\.webflow\.io\/project-types\/([a-z0-9-]+)/gi, '/project-types/$1')
    // Faceblind
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/faceblind/gi, '/faceblind')
    // Home root
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/(?=["'])/gi, '/');
}

function stripWebflowFormRuntime(html: string): string {
  // Disable behavior with minimal structural change to preserve layout
  let out = html;

  // 1) Strip Webflow data attributes that trigger runtime
  out = out.replace(/\sdata-wf-[a-z-]+="[^"]*"/gi, '');

  // 2) Make the form inert but keep markup and inputs intact
  out = out.replace(/<form\b([^>]*)>/gi, (_m, attrs) => {
    const cleaned = String(attrs)
      .replace(/\saction="[^"]*"/gi, '')
      .replace(/\smethod="[^"]*"/gi, '');
    return `<form${cleaned} onsubmit="return false" action="#">`;
  });

  return out;
}

let webflowBody = stripWebflowFormRuntime(rewriteHomepageLinks(originalBody));

// Do not strip content; only strip inline scripts to avoid hydration drift
webflowBody = webflowBody.replace(/<script[\s\S]*?<\/script>/gi, '');

// CSS guard to avoid any late-applied class causing a width jump
const guardCss = '<style id="guard-globalmargin">.globalmargin{max-width:1500px!important;margin:0 auto!important;padding:40px 40px 80px!important;}</style>';

export default function Home() {
  return (
    <main className="retro-root" suppressHydrationWarning>
      {/* Homepage-specific features */}
      <Script src="/js/homepage-features.js" strategy="afterInteractive" />
      <div dangerouslySetInnerHTML={{ __html: webflowBody }} />
    </main>
  );
}
