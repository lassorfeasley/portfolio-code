import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join(process.cwd(), 'public/webflow/faceblind.html'), 'utf-8');
const body = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)?.[1] ?? '';

export const dynamic = 'error';

export default function FaceblindPage() {
  return (
    <main className="retro-root" dangerouslySetInnerHTML={{ __html: body }} />
  );
}


