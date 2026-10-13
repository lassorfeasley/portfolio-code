import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import SiteImage from '@/app/components/SiteImage';
import FooterDesktop from '@/app/components/FooterDesktop';

export const revalidate = false;

export default async function WorkIndex() {
  const supabase = supabaseServer();
  const [projects, folderLinks] = await Promise.all([
    listPublishedProjects(supabase),
    getFolderLinks(supabase),
  ]);

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
                <SiteImage
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


