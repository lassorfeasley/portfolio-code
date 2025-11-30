import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';

export const revalidate = 60;

export default async function WorkIndex() {
  const supabase = supabaseServer();
  const projects = await listPublishedProjects(supabase);

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
    </main>
  );
}


