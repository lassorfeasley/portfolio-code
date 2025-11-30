import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';

export const revalidate = 60;

export default async function ProjectTypesIndex() {
  const supabase = supabaseServer();
  let types: ProjectTypeSummary[] = [];
  let errorMessage: string | null = null;
  try {
    types = await listPublishedProjectTypes(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Failed to load project types.';
  }

  if (errorMessage) {
    return <main className="retro-root"><div className="globalmargin"><p>Failed to load project types.</p></div></main>;
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
    </main>
  );
}


