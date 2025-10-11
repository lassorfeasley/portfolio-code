import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

type Article = {
  id: string;
  name: string;
  slug: string;
  publication: string | null;
  title: string | null;
  date_published: string | null;
  url: string | null;
  featured_image_url: string | null;
};

export async function generateStaticParams() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('articles')
    .select('id,name,slug,publication,title,date_published,url,featured_image_url')
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error || !data) return notFound();
  const a = data as Article;

  return (
    <main className="retro-root">
      <section className="cluttered-desktop-container">
        <div className="retro-window">
          <div className="window-bar">
            <div className="x-out" />
          </div>
          <div className="window-content">
            <h1>{a.title ?? a.name}</h1>
            {a.publication ? <p>{a.publication}</p> : null}
            {a.date_published ? <p>{new Date(a.date_published).toLocaleDateString()}</p> : null}
            {a.featured_image_url ? <img src={a.featured_image_url} alt={a.title ?? a.name} /> : null}
            {a.url ? (
              <p>
                <a href={a.url} target="_blank" rel="noreferrer">Read externally</a>
              </p>
            ) : null}
          </div>
          <div className="resize-corner" />
        </div>
      </section>
    </main>
  );
}


