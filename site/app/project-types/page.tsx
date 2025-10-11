import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

type ProjectType = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
};

export default async function ProjectTypesIndex() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('project_types')
    .select('id,name,slug,category')
    .eq('draft', false)
    .eq('archived', false)
    .order('name', { ascending: true });

  if (error) {
    return <main className="retro-root"><div className="globalmargin"><p>Failed to load project types.</p></div></main>;
  }

  const types = (data ?? []) as ProjectType[];

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


