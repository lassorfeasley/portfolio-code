import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getPublishedArticleBySlug, listArticleSlugs } from '@/lib/domain/articles/service';
import type { ArticleRow } from '@/lib/domain/articles/types';
import { NotFoundError } from '@/lib/api/errors';

export const revalidate = 60;

export async function generateStaticParams() {
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) return [];
  const supabase = supabaseServer();
  const slugs = await listArticleSlugs(supabase);
  return slugs.map((slug) => ({ slug }));
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
  let a: ArticleRow;
  try {
    a = await getPublishedArticleBySlug(supabase, slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound();
    }
    throw error;
  }

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


