import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

type Project = {
  id: string;
  name: string | null;
  slug: string;
  description: string | null;
  featured_image_url: string | null;
  images_urls: string[] | null;
  process_image_urls: string[] | null;
  process_images_label: string | null;
  process_and_context_html: string | null;
  year: string | null;
  linked_document_url: string | null;
  video_url: string | null;
  fallback_writing_url: string | null;
};

export async function generateStaticParams() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('projects')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url')
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error || !data) return notFound();
  const p = data as Project;

  return (
    <main className="retro-root">
      <div className="globalmargin">
        {/* Top navigation bar */}
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
          <Link href="/work" className="h _5 link w-inline-block"><div>Work</div><div>→</div></Link>
          <div className="h _5 link"><div className="text-block-5">{p.name}</div></div>
        </div>

        <div className="windowcanvas">
          <div className="onetwogrid _40">
            <div className="retro-window-placeholder">
              <div className="retro-window nomax noscrollonm">
                <div className="window-bar">
                  <div className="paragraph wide">{p.name}</div>
                  <div className="x-out">×</div>
                </div>
                <div className="window-content-wrapper noscrollonm">
                  <div className="window-content">
                    {p.description ? <div className="paragraph">{p.description}</div> : null}
                    {p.featured_image_url ? (
                      <img src={p.featured_image_url} alt={p.name ?? ''} className="lightbox-link w-condition-invisible" />
                    ) : null}
                    {p.video_url ? (
                      <div className="videowrapper">
                        <div className="video w-video w-embed">
                          <iframe src={p.video_url} title={p.name ?? 'video'} frameBorder={0} allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowFullScreen />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="resize-corner" />
              </div>
            </div>
            <div className="retro-window-placeholder noratio pushdown">
              <div className="retro-window doublewide square">
                <div className="window-bar">
                  <div className="paragraph wide">Final images and renderings</div>
                  <div className="x-out">×</div>
                </div>
                <div className="window-content-wrapper">
                  <div className="window-content">
                    {Array.isArray(p.images_urls) && p.images_urls.length > 0 ? (
                      <div className="gallery">
                        <div className="collection-list w-dyn-items">
                          {p.images_urls.map((url, i) => (
                            <div key={i} className="collection-item w-dyn-item w-dyn-repeater-item">
                              <a href="#" style={{ backgroundImage: `url(${url})` }} className="lightbox-link w-inline-block w-lightbox" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="resize-corner" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="globalmargin">
        <div className="twoonegrid moveup">
          <div className="retro-window-placeholder">
            <div className="retro-window doublewide noratioonm">
              <div className="window-bar">
                <div className="paragraph wide">Process and context</div>
                <div className="x-out">×</div>
              </div>
              <div className="window-content-wrapper portratio">
                <div className="window-content">
                  {p.process_and_context_html ? (
                    <div className="v _10">
                      <div className="paragraph w-richtext" dangerouslySetInnerHTML={{ __html: p.process_and_context_html }} />
                    </div>
                  ) : null}
                  {Array.isArray(p.process_image_urls) && p.process_image_urls.length > 0 ? (
                    <div className="v _10">
                      {p.process_images_label ? <div className="captionlable">{p.process_images_label}</div> : null}
                      <div className="gallery">
                        <div className="collection-list w-dyn-items">
                          {p.process_image_urls.map((url, i) => (
                            <div key={i} className="collection-item w-dyn-item w-dyn-repeater-item">
                              <a href="#" style={{ backgroundImage: `url(${url})` }} className="lightbox-link w-inline-block w-lightbox" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="resize-corner" />
            </div>
          </div>
        </div>
        {/* Footer (desktop icon grid) aligned to margins */}
        <div className="windowcanvas foot">
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


