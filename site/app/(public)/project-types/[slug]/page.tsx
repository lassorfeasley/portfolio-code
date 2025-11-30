import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import FooterDesktop from '@/app/components/FooterDesktop';
import RetroWindow from '@/app/components/RetroWindow';

export const revalidate = 60;

export async function generateStaticParams() {
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) return [];
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('project_types')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const url = `/project-types/${slug}`;
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  };
}

export default async function ProjectTypePage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    if (!hasEnv) {
      return (
        <main className="retro-root">
          <div className="globalmargin">
            <div className="topbar">
              <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
              <Link href={`/project-types/${slug}`} className="h _5 link w-inline-block"><div>Collections</div><div>→</div></Link>
              <div className="h _5 link"><div className="text-block-5">{slug}</div></div>
            </div>
            <div className="windowcanvas">
              <div className="retro-window-placeholder">
                <div className="retro-window">
                  <div className="window-bar"><div className="paragraph">This collection is unavailable in local dev</div><div className="x-out">×</div></div>
                  <div className="window-content-wrapper"><div className="window-content"><div className="paragraph">Supabase env vars are not set.</div></div></div>
                  <div className="resize-corner" />
                </div>
              </div>
            </div>
          </div>
          <FooterDesktop />
        </main>
      );
    }
    const supabase = supabaseServer();

    const [{ data: typeData, error: typeError }, { data: projects, error: projectsError }] = await Promise.all([
      supabase
        .from('project_types')
        .select('id,name,slug,category,landing_page_credentials,font_awesome_icon')
        .eq('slug', slug)
        .eq('draft', false)
        .eq('archived', false)
        .single(),
      supabase
        .from('projects')
        .select('id,name,slug,featured_image_url,year,description,project_type_id')
        .eq('draft', false)
        .eq('archived', false),
    ]);

    if (typeError) {
      console.error('Error fetching project type:', typeError);
      return notFound();
    }

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    if (!typeData) return notFound();

  const filtered = (projects ?? []).filter((p) => p.project_type_id === typeData.id);
  const article = /^[aeiou]/i.test(typeData.name ?? '') ? 'an' : 'a';

  return (
    <main className="retro-root">
      <div className="globalmargin">
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
          <Link href={`/project-types/${typeData.slug}`} className="h _5 link w-inline-block w-condition-invisible w--current"><div>Collections</div><div>→</div></Link>
          <div className="h _5 link"><div className="text-block-5">{typeData.name}</div></div>
        </div>
        <div className="windowcanvas onetwogrid alert">
          <div className="retro-window-placeholder">
            <RetroWindow title={`${typeData.name}.txt`} disableResize initialZIndex={1}>
              <div className="v _10">
                {typeData.font_awesome_icon ? (
                  <div className="iconlogo">{typeData.font_awesome_icon}</div>
                ) : null}
                {typeData.landing_page_credentials ? (
                  <div className="paragraph">{typeData.landing_page_credentials}</div>
                ) : typeData.category ? (
                  <div className="paragraph">{typeData.category}</div>
                ) : null}
              </div>
            </RetroWindow>
          </div>
          <div className="retro-window-placeholder alertmover">
            <RetroWindow
              title="Alert"
              className="noratio popup"
              disableResize
              initialZIndex={2}
              autoFocus
            >
              <div className="v _10">
                <div className="iconlogo red"></div>
                <a href={`mailto:feasley@lassor.com?subject=Work%20with%20Lassor`} className="paragraph w-inline-block">
                  <div className="w-embed">{`Explore ${article} ${typeData.name} design project with Lassor?`}</div>
                </a>
                <a href={`mailto:feasley@lassor.com?subject=Positive%20Vibes`} className="h _20 w-inline-block">
                  <div className="paragraph button">Yes</div>
                  <div className="paragraph button">No</div>
                  <div className="paragraph button">OK</div>
                  <div className="paragraph button">Cancel</div>
                </a>
              </div>
            </RetroWindow>
          </div>
        </div>
        <div className="windowcanvas w-dyn-list">
          <div role="list" className="desktopgrid w-dyn-items">
            {filtered.map((p) => (
              <div key={p.id} role="listitem" className="retro-window-placeholder w-dyn-item">
                <div id="draggable-window" className="retro-window">
                  <div className="window-bar">
                    <div className="paragraph wide">{p.name}</div>
                    <div className="x-out">×</div>
                  </div>
                  <div className="window-content-wrapper">
                    <Link href={`/work/${p.slug}`} className="window-content w-inline-block">
                      <div className="v _10">
                        {p.description ? <div className="paragraph maxht">{p.description}</div> : null}
                        <div className="paragraph mxht learn-more">learn more →</div>
                      </div>
                      {p.featured_image_url ? (
                        <img src={p.featured_image_url} alt={p.name ?? ''} className="lightbox-link" />
                      ) : null}
                    </Link>
                  </div>
                  <div className="resize-corner" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterDesktop />
    </main>
  );
  } catch (error) {
    console.error('Error in ProjectTypePage:', error);
    return (
      <main className="retro-root">
        <div className="globalmargin">
          <div className="topbar">
            <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
            <div className="h _5 link"><div>Error</div></div>
          </div>
          <div className="windowcanvas">
            <div className="retro-window-placeholder">
              <div className="retro-window">
                <div className="window-bar"><div className="paragraph">Error</div><div className="x-out">×</div></div>
                <div className="window-content-wrapper">
                  <div className="window-content">
                    <div className="paragraph">
                      {error instanceof Error ? error.message : 'An error occurred loading this page.'}
                    </div>
                  </div>
                </div>
                <div className="resize-corner" />
              </div>
            </div>
          </div>
        </div>
        <FooterDesktop />
      </main>
    );
  }
}


