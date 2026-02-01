import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import FooterDesktop from '@/app/components/FooterDesktop';

export const revalidate = 60;

export default async function ProjectTypesIndex() {
  const supabase = supabaseServer();
  let types: ProjectTypeSummary[] = [];
  let folderLinks: FolderLink[] = defaultFolderLinks;
  let errorMessage: string | null = null;
  
  try {
    const [typesData, links] = await Promise.all([
      listPublishedProjectTypes(supabase),
      getFolderLinks(supabase),
    ]);
    types = typesData;
    folderLinks = links;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Failed to load project types.';
  }

  if (errorMessage) {
    return (
      <main className="retro-root">
        <div className="globalmargin"><p>Failed to load project types.</p></div>
        <FooterDesktop folderLinks={folderLinks} />
      </main>
    );
  }

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


