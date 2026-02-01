import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedArticles } from '@/lib/domain/articles/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { ArticleSummary } from '@/lib/domain/articles/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import FooterDesktop from '@/app/components/FooterDesktop';

export const revalidate = 60;

export default async function WritingIndex() {
  const supabase = supabaseServer();
  let articles: ArticleSummary[] = [];
  let folderLinks: FolderLink[] = defaultFolderLinks;
  
  try {
    const [articlesData, links] = await Promise.all([
      listPublishedArticles(supabase),
      getFolderLinks(supabase),
    ]);
    articles = articlesData;
    folderLinks = links;
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
      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}


