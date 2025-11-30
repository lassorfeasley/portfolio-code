import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedArticles } from '@/lib/domain/articles/service';
import type { ArticleSummary } from '@/lib/domain/articles/types';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';

export const revalidate = 60;

export default async function WritingIndex() {
  const supabase = supabaseServer();
  let articles: ArticleSummary[] = [];
  try {
    articles = await listPublishedArticles(supabase);
  } catch (error) {
    console.error(error);
  }

  return (
    <main className="retro-root">
      <section className="cluttered-desktop-container">
        {articles.map((a) => (
          <div key={a.slug} className="retro-window">
            <div className="window-bar">
              <div className="x-out" />
            </div>
            <div className="window-content">
              <h2><Link href={`/writing/${a.slug}`}>{a.title ?? a.name}</Link></h2>
              {a.featured_image_url ? (
                <ImageWithSupabaseFallback
                  src={a.featured_image_url}
                  alt={a.title ?? a.name ?? ''}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : null}
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


