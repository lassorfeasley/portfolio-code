import fs from 'node:fs';
import path from 'node:path';

const webflowHtml = fs.readFileSync(path.join(process.cwd(), 'public/webflow/index.html'), 'utf-8');
const originalBody = webflowHtml.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)?.[1] ?? '';

function rewriteHomepageLinks(html: string): string {
  return html
    // Projects → /work/[slug]
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/projects\/([a-z0-9-]+)/gi, '/work/$1')
    // Project types → /project-types/[slug]
    .replace(/https?:\/\/(?:www\.)?lassor\.com\/project-types\/([a-z0-9-]+)/gi, '/project-types/$1')
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

const webflowBody = stripWebflowFormRuntime(rewriteHomepageLinks(originalBody))
  // Lock the wrapper width early to prevent post-hydration width jumps
  .replace(
    /<div class=\"globalmargin\"([^>]*)>/i,
    '<div class="globalmargin" $1 style="max-width:1500px;margin:0 auto;padding:40px 40px 80px;">'
  )
  .replace('<div class="globalmargin d">', '<div class="globalmargin d">');

// CSS guard to avoid any late-applied class causing a width jump
const guardCss = '<style id="guard-globalmargin">.globalmargin{max-width:1500px!important;margin:0 auto!important;padding:40px 40px 80px!important;}</style>';

export default function Home() {
  return (
    <main className="retro-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: webflowBody }} />
  );
}
