import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import FooterDesktop from '@/app/components/FooterDesktop';

export const revalidate = 60;

export default async function WorkIndex() {
  const supabase = supabaseServer();
  let folderLinks: FolderLink[] = defaultFolderLinks;
  
  const [projects, links] = await Promise.all([
    listPublishedProjects(supabase),
    getFolderLinks(supabase),
  ]);
  folderLinks = links;

  return (
    <main className="retro-root">
      <section className="cluttered-desktop-container">
        {projects.map((p) => (
          <div key={p.slug} className="retro-window">
            <div className="window-bar">
              <div className="x-out" />
            </div>
            <div className="window-content">
              <h2><Link href={`/work/${p.slug}`}>{p.name}</Link></h2>
              {p.featured_image_url ? (
                <ImageWithSupabaseFallback
                  src={p.featured_image_url}
                  alt={p.name ?? ''}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : null}
              {p.year ? <p>{p.year}</p> : null}
              {p.description ? <p>{p.description}</p> : null}
            </div>
            <div className="resize-corner" />
          </div>
        ))}
      </section>
      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}


