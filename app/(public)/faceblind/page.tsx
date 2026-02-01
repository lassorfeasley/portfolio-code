import fs from 'node:fs';
import path from 'node:path';
import FooterDesktop from '@/app/components/FooterDesktop';
import { supabaseServer } from '@/lib/supabase/server';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import { hasSupabaseEnv } from '@/lib/utils/env';

function getProcessedBody(): string {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/webflow/faceblind.html'), 'utf-8');
  let body = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)?.[1] ?? '';

  // Strip scripts to avoid hydration mismatch and duplicate execution
  // (Core effects are loaded in layout.tsx)
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Strip the static footer (the <div id="desktop" class="windowcanvas"> section)
  // Split at the footer start and keep only the content before it, plus closing the .globalmargin div
  const footerStart = body.indexOf('<div id="desktop"');
  if (footerStart !== -1) {
    body = body.substring(0, footerStart) + '</div>';
  }

  return body;
}

export const revalidate = 60;

export default async function FaceblindPage() {
  const body = getProcessedBody();
  let folderLinks: FolderLink[] = defaultFolderLinks;

  if (hasSupabaseEnv()) {
    const supabase = supabaseServer();
    try {
      folderLinks = await getFolderLinks(supabase);
    } catch (error) {
      console.error('Failed to load folder links:', error);
    }
  }

  return (
    <main className="retro-root">
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: body }} />
      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}
