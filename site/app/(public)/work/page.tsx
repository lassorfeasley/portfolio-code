import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function WorkIndex() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('projects')
    .select('name,slug,featured_image_url,year,description')
    .eq('draft', false)
    .eq('archived', false)
    .order('published_on', { ascending: false });

  return (
    <main className="retro-root">
      <section className="cluttered-desktop-container">
        {(data ?? []).map((p) => (
          <div key={p.slug} className="retro-window">
            <div className="window-bar">
              <div className="x-out" />
            </div>
            <div className="window-content">
              <h2><Link href={`/work/${p.slug}`}>{p.name}</Link></h2>
              {p.featured_image_url ? <img src={p.featured_image_url} alt={p.name ?? ''} /> : null}
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


