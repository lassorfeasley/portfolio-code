import type { Metadata } from 'next';
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
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) return [];
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const url = `/writing/${slug}`;
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) {
    return (
      <main className="retro-root">
        <section className="cluttered-desktop-container">
          <div className="retro-window">
            <div className="window-bar"><div className="x-out" /></div>
            <div className="window-content">
              <h1>{slug}</h1>
              <p>Article content unavailable in local dev (Supabase env vars missing).</p>
            </div>
            <div className="resize-corner" />
          </div>
        </section>
      </main>
    );
  }
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


