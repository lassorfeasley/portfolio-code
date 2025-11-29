import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import FooterDesktop from '@/app/components/FooterDesktop';
import RetroWindow from '@/app/components/RetroWindow';
import ExternalLinksWindow from '@/app/components/ExternalLinksWindow';
import { toLargeUrl } from '@/lib/supabase/image';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import LightboxGallery from '@/app/components/LightboxGallery';

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
  project_types?: { name: string | null; slug: string } | { name: string | null; slug: string }[] | null;
};

function toEmbedUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    // Accept full iframe HTML and extract its src
    if (/^\s*<iframe[\s\S]*?>/i.test(raw)) {
      const m = raw.match(/\ssrc=["']([^"']+)["']/i);
      if (m && m[1]) raw = m[1];
    }
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    // YouTube → embed
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) {
        id = u.pathname.replace(/^\//, '');
      } else if (u.pathname.startsWith('/watch')) {
        id = u.searchParams.get('v') ?? '';
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2] ?? '';
      } else if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.split('/')[2] ?? '';
      }
      if (id) {
        const params = new URLSearchParams();
        const start = u.searchParams.get('t') || u.searchParams.get('start');
        if (start) params.set('start', String(start).replace(/s$/i, ''));
        const query = params.toString();
        return `https://www.youtube-nocookie.com/embed/${id}${query ? `?${query}` : ''}`;
      }
    }
    // Vimeo → embed
    if (host.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) return [];
  const supabase = supabaseServer();
  const { data } = await supabase
    .from('projects')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const url = `/work/${slug}`;
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  if (!hasEnv) {
    return (
      <main className="retro-root">
        <div className="globalmargin">
          <div className="topbar">
            <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
            <Link href="/work" className="h _5 link w-inline-block"><div>Work</div><div>→</div></Link>
            <div className="h _5 link"><div className="text-block-5">{slug}</div></div>
          </div>
          <div className="windowcanvas">
            <div className="retro-window-placeholder">
              <RetroWindow title="This project is unavailable in local dev">
                <div className="paragraph">Supabase env vars are not set. Set them to view live content.</div>
              </RetroWindow>
            </div>
          </div>
        </div>
        <FooterDesktop />
      </main>
    );
  }
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('projects')
    .select('id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url,project_types(name,slug)')
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error || !data) return notFound();
  const p = data as Project;
  const projectTypeRel = p.project_types;
  const projectType = Array.isArray(projectTypeRel)
    ? (projectTypeRel[0] ?? null)
    : (projectTypeRel ?? null);
  const projectTypeName = projectType?.name ?? 'Work';
  const projectTypeHref = projectType?.slug ? `/project-types/${projectType.slug}` : '/work';
  const hasFinalImages = Array.isArray(p.images_urls) && p.images_urls.length > 0;
  const hasProcessSection = ((p.process_and_context_html ?? '').trim() !== '') || (Array.isArray(p.process_image_urls) && p.process_image_urls.length > 0);
  const externalLinks = (() => {
    const links: { href: string; label: string }[] = [];
    const toBrand = (rawUrl: string | null): string | null => {
      if (!rawUrl) return null;
      try {
        const u = new URL(rawUrl);
        const host = u.hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.') || u.hostname;
        const brand = host.split('-').join(' ').split('.').join(' ');
        return brand.toUpperCase();
      } catch {
        return null;
      }
    };
    const projectName = (p.name ?? '').toUpperCase();
    const add = (href: string | null) => {
      const brand = toBrand(href);
      if (href && brand) links.push({ href, label: `${brand} × ${projectName}` });
    };
    add(p.linked_document_url);
    add(p.fallback_writing_url);
    return links;
  })();

  return (
    <main className="retro-root">
      <div className="globalmargin">
        {/* Top navigation bar */}
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
          <Link href={projectTypeHref} className="h _5 link w-inline-block"><div>{projectTypeName}</div><div>→</div></Link>
          <div className="h _5 link"><div className="text-block-5">{p.name}</div></div>
        </div>

        <div className="windowcanvas">
          <div className="onetwogrid _40">
            <div className="retro-window-placeholder">
              <RetroWindow title={p.name ?? ''} className="nomax noscrollonm">
                {p.description ? <div className="paragraph">{p.description}</div> : null}
                {/* If a video is present, do not show featured image to avoid duplication */}
                {!p.video_url && p.featured_image_url ? (
                  <ImageWithSupabaseFallback
                    src={toLargeUrl(p.featured_image_url, 1800)}
                    alt={p.name ?? ''}
                    className="lightbox-link"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : null}
                {p.video_url ? (
                  <div className="videowrapper">
                    <div className="video w-video w-embed" style={{ maxHeight: 'none', height: 'auto' }}>
                      <iframe
                        src={toEmbedUrl(p.video_url) ?? undefined}
                        title={p.name ?? 'video'}
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        width="560"
                        height="315"
                        style={{ maxWidth: '100%' }}
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  </div>
                ) : null}
              </RetroWindow>
            </div>
            {hasFinalImages ? (
              <div className="retro-window-placeholder noratio pushdown">
                <RetroWindow title="Final images and renderings" className="doublewide square">
                  <div className="gallery">
                    <LightboxGallery images={p.images_urls!} />
                  </div>
                </RetroWindow>
              </div>
            ) : null}
          </div>

          <div className="twoonegrid moveup">
            {hasProcessSection ? (
              <div className="retro-window-placeholder">
                <RetroWindow title="Process and context" className="doublewide noratioonm">
                  {(p.process_and_context_html ?? '').trim() !== '' ? (
                    <div className="v _10">
                      <div className="paragraph w-richtext" dangerouslySetInnerHTML={{ __html: p.process_and_context_html as string }} />
                    </div>
                  ) : null}
                  {Array.isArray(p.process_image_urls) && p.process_image_urls.length > 0 ? (
                    <div className="v _10">
                      {p.process_images_label ? <div className="captionlable">{p.process_images_label}</div> : null}
                      <div className="gallery">
                        <LightboxGallery images={p.process_image_urls} />
                      </div>
                    </div>
                  ) : null}
                </RetroWindow>
              </div>
            ) : null}
          </div>

          <ExternalLinksWindow links={externalLinks} />
        </div>
      </div>

      <FooterDesktop />
    </main>
  );
}


