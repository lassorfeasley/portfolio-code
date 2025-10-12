import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('project_types')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((t) => ({ slug: t.slug }));
}

export default async function ProjectTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = supabaseServer();

  const [{ data: typeData }, { data: projects }] = await Promise.all([
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

  if (!typeData) return notFound();

  const filtered = (projects ?? []).filter((p) => p.project_type_id === typeData.id);
  const article = /^[aeiou]/i.test(typeData.name ?? '') ? 'an' : 'a';

  return (
    <main className="retro-root">
      <div className="globalmargin">
        {/* Top navigation bar (breadcrumb-style) */}
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
          <Link href={`/project-types/${typeData.slug}`} className="h _5 link w-inline-block w-condition-invisible w--current"><div>Collections</div><div>→</div></Link>
          <div className="h _5 link"><div className="text-block-5">{typeData.name}</div></div>
        </div>
        {/* Intro + alert windows in one windowcanvas to match Webflow positioning */}
        <div className="windowcanvas onetwogrid alert">
          <div className="retro-window-placeholder">
            <div className="retro-window">
              <div className="window-bar">
                <div className="wide">
                  <div className="paragraph">{typeData.name}</div>
                  <div className="paragraph">.txt</div>
                </div>
                <div className="x-out">×</div>
              </div>
              <div className="window-content-wrapper">
                <div className="window-content">
                  {typeData.font_awesome_icon ? (
                    <div className="iconlogo">{typeData.font_awesome_icon}</div>
                  ) : null}
                  {typeData.landing_page_credentials ? (
                    <div className="paragraph">{typeData.landing_page_credentials}</div>
                  ) : typeData.category ? (
                    <div className="paragraph">{typeData.category}</div>
                  ) : null}
                </div>
              </div>
              <div className="resize-corner" />
            </div>
          </div>

          {/* Alert popup */}
          <div className="retro-window-placeholder alertmover">
            <div className="retro-window noratio popup">
              <div className="window-bar">
                <div className="wide"><div className="paragraph">Alert</div></div>
                <div className="x-out">×</div>
              </div>
              <div className="window-content-wrapper">
                <div className="window-content">
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
              </div>
              <div className="resize-corner" />
            </div>
          </div>
        </div>
      
        {/* Projects list matching Webflow grid classes */}
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

      {/* Footer (desktop icon grid) */}
      <div className="globalmargin">
        <div id="desktop" className="windowcanvas">
          <div className="wide">
          <div className="align-right">
            <div className="folder-grid">
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/project-types/interaction-design" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">UI design</div></Link>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/project-types/writing" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">Writing</div></Link>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <a href="https://docs.google.com/document/d/1qz8Qwrk6aoD1n1vEe5Zd7OhaEhun8UOuY0xcW2SnRmg/edit?tab=t.0" target="_blank" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">Resume</div></a>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/project-types/interaction-design" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">UX design</div></Link>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/work/walking-forward" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">Walking forward</div></Link>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <a href="https://www.linkedin.com/in/lassor/" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">LinkedIn</div></a>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/project-types/industrial-design" className="iconlink w-inline-block"><div className="folder"></div><div className="navlink foldericon">Industrial design</div></Link>
                </div>
              </div>
              <div className="icon-placeholder">
                <div className="draggable-folder">
                  <Link href="/work/seatback-safety" className="iconlink w-inline-block"><div className="folder"></div><p className="navlink foldericon">Seatback Safety</p></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}


