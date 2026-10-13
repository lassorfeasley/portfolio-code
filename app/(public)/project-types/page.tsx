import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import FooterDesktop from '@/app/components/FooterDesktop';

export const revalidate = false;

export default async function ProjectTypesIndex() {
  const supabase = supabaseServer();
  const [types, folderLinks] = await Promise.all([
    listPublishedProjectTypes(supabase),
    getFolderLinks(supabase),
  ]);

  return (
    <main className="retro-root">
      <div className="globalmargin">
        {types.map((t) => (
          <div key={t.id} className="retro-window">
            <div className="window-bar">
              <div className="paragraph wide">{t.name}</div>
              <div className="x-out" />
            </div>
            <div className="window-content-wrapper">
              <div className="window-content">
                <div className="v _5">
                  {t.category ? <p className="paragraph mxht">{t.category}</p> : null}
                  <div className="paragraph mxht learn-more">
                    <Link href={`/project-types/${t.slug}`}>view projects →</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="resize-corner" />
          </div>
        ))}
      </div>
      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}


