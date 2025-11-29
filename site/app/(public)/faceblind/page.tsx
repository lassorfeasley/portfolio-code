import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join(process.cwd(), 'public/webflow/faceblind.html'), 'utf-8');
let body = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)?.[1] ?? '';

// Strip scripts to avoid hydration mismatch and duplicate execution
// (Core effects are loaded in layout.tsx)
body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

export const dynamic = 'error';

export default function FaceblindPage() {
  return (
    <main className="retro-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: body }} />
  );
}
