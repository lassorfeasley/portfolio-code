import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function WritingIndex() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('articles')
    .select('name,slug,publication,title,date_published,featured_image_url')
    .eq('draft', false)
    .eq('archived', false)
    .order('date_published', { ascending: false });

  return (
    <main className="retro-root">
      <section className="cluttered-desktop-container">
        {(data ?? []).map((a) => (
          <div key={a.slug} className="retro-window">
            <div className="window-bar">
              <div className="x-out" />
            </div>
            <div className="window-content">
              <h2><Link href={`/writing/${a.slug}`}>{a.title ?? a.name}</Link></h2>
              {a.featured_image_url ? <img src={a.featured_image_url} alt={a.title ?? a.name} /> : null}
              {a.publication ? <p>{a.publication}</p> : null}
              {a.date_published ? <p>{new Date(a.date_published).toLocaleDateString()}</p> : null}
            </div>
            <div className="resize-corner" />
          </div>
        ))}
      </section>
    </main>
  );
}


