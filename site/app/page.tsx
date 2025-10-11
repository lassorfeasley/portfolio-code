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

const webflowBody = rewriteHomepageLinks(originalBody)
  // Ensure the top-level wrapper div has globalmargin class so content centers like Webflow
  .replace('<div class="globalmargin">', '<div class="globalmargin">')
  .replace('<div class="globalmargin d">', '<div class="globalmargin d">');

export default function Home() {
  return (
    <main className="retro-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: webflowBody }} />
  );
}
