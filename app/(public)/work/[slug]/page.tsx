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
import {
  getPublishedProjectBySlug,
  listPublicProjectSlugs,
} from '@/lib/domain/projects/service';
import { listPublishedArticlesByProjectId } from '@/lib/domain/articles/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { ProjectDetail } from '@/lib/domain/projects/types';
import type { ArticleSummary } from '@/lib/domain/articles/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import { NotFoundError } from '@/lib/api/errors';
import { hasSupabaseEnv } from '@/lib/utils/env';
import { toEmbedUrl, toBrand } from '@/lib/utils/urls';

export const revalidate = 60;

export async function generateStaticParams() {
  if (!hasSupabaseEnv()) return [];
  const supabase = supabaseServer();
  const slugs = await listPublicProjectSlugs(supabase);
  return slugs.map((slug) => ({ slug }));
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
  if (!hasSupabaseEnv()) {
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
  let project: ProjectDetail;
  let folderLinks: FolderLink[] = defaultFolderLinks;
  let articles: ArticleSummary[] = [];

  try {
    // Fetch project and folder links in parallel
    // getFolderLinks handles its own errors and returns defaults, so it won't fail the Promise.all unless something critical happens
    const [projectData, links] = await Promise.all([
      getPublishedProjectBySlug(supabase, slug),
      getFolderLinks(supabase)
    ]);
    project = projectData;
    folderLinks = links;
    
    // Fetch articles associated with this project
    articles = await listPublishedArticlesByProjectId(supabase, project.id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound();
    }
    throw error;
  }
  const projectType = project.projectType;
  const projectTypeName = projectType?.name ?? 'Work';
  const projectTypeHref = projectType?.slug ? `/project-types/${projectType.slug}` : '/work';
  const hasFinalImages = Array.isArray(project.images_urls) && project.images_urls.length > 0;
  const hasProcessSection =
    ((project.process_and_context_html ?? '').trim() !== '') ||
    (Array.isArray(project.process_image_urls) && project.process_image_urls.length > 0);
  const externalLinks = (() => {
    const links: { href: string; label: string }[] = [];
    const projectName = (project.name ?? '').toUpperCase();
    const add = (href: string | null) => {
      const brand = toBrand(href);
      if (href && brand) links.push({ href, label: `${brand} × ${projectName}` });
    };
    add(project.linked_document_url);
    add(project.fallback_writing_url);
    return links;
  })();

  return (
    <main className="retro-root">
      <div className="globalmargin">
        {/* Top navigation bar */}
        <div className="topbar">
          <Link href="/" className="h _5 link w-inline-block"><div>Lassor.com</div><div>→</div></Link>
          <Link href={projectTypeHref} className="h _5 link w-inline-block"><div>{projectTypeName}</div><div>→</div></Link>
          <div className="h _5 link"><div className="text-block-5">{project.name}</div></div>
        </div>

        <div className="windowcanvas">
          <div className="onetwogrid _40">
            <div className="retro-window-placeholder">
              <RetroWindow title={project.name ?? ''} className="nomax noscrollonm">
                {project.description ? <div className="paragraph">{project.description}</div> : null}
                {/* If a video is present, do not show featured image to avoid duplication */}
                {!project.video_url && project.featured_image_url ? (
                  <ImageWithSupabaseFallback
                    src={toLargeUrl(project.featured_image_url, 1800)}
                    alt={project.name ?? ''}
                    className="lightbox-link"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : null}
                {project.video_url ? (
                  <div className="videowrapper">
                    <div className="video w-video w-embed" style={{ maxHeight: 'none', height: 'auto' }}>
                      <iframe
                        src={toEmbedUrl(project.video_url) ?? undefined}
                        title={project.name ?? 'video'}
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
                    <LightboxGallery images={project.images_urls!} />
                  </div>
                </RetroWindow>
              </div>
            ) : null}
            {/* Show process section in the same row when no final images */}
            {!hasFinalImages && hasProcessSection ? (
              <div className="retro-window-placeholder" style={{ marginTop: 120, height: 'fit-content' }}>
                <RetroWindow title="Process and context" className="doublewide noratio">
                  {(project.process_and_context_html ?? '').trim() !== '' ? (
                    <div className="v _10">
                      <div className="paragraph w-richtext" dangerouslySetInnerHTML={{ __html: project.process_and_context_html as string }} />
                    </div>
                  ) : null}
                  {Array.isArray(project.process_image_urls) && project.process_image_urls.length > 0 ? (
                    <div className="v _10">
                      {project.process_images_label ? <div className="captionlable">{project.process_images_label}</div> : null}
                      <div className="gallery">
                        <LightboxGallery images={project.process_image_urls} />
                      </div>
                    </div>
                  ) : null}
                </RetroWindow>
              </div>
            ) : null}
          </div>

          {/* Show process section below when there are final images */}
          {hasFinalImages && hasProcessSection ? (
            <div className="twoonegrid moveup">
              <div className="retro-window-placeholder">
                <RetroWindow title="Process and context" className="doublewide noratioonm">
                  {(project.process_and_context_html ?? '').trim() !== '' ? (
                    <div className="v _10">
                      <div className="paragraph w-richtext" dangerouslySetInnerHTML={{ __html: project.process_and_context_html as string }} />
                    </div>
                  ) : null}
                  {Array.isArray(project.process_image_urls) && project.process_image_urls.length > 0 ? (
                    <div className="v _10">
                      {project.process_images_label ? <div className="captionlable">{project.process_images_label}</div> : null}
                      <div className="gallery">
                        <LightboxGallery images={project.process_image_urls} />
                      </div>
                    </div>
                  ) : null}
                </RetroWindow>
              </div>
            </div>
          ) : null}

          <ExternalLinksWindow links={externalLinks} />
        </div>

        {/* Articles section - three column grid */}
        {articles.length > 0 ? (
          <div className="windowcanvas w-dyn-list" style={{ height: 'fit-content', minHeight: 'auto' }}>
            <div role="list" className="desktopgrid w-dyn-items" style={{ alignItems: 'start' }}>
              {articles.map((article) => {
                const articleTitle = article.title || article.name || 'Article';
                const publicationName = article.publication || 'Article';
                const contentEl = (
                  <>
                    <div className="v _10">
                      <div className="paragraph homepage">{articleTitle}</div>
                      {article.url ? (
                        <div className="paragraph mxht learn-more">
                          Read @ {publicationName} →
                        </div>
                      ) : null}
                    </div>
                    {article.featured_image_url ? (
                      <ImageWithSupabaseFallback
                        src={article.featured_image_url}
                        alt={articleTitle}
                        className="lightbox-link"
                        style={{ width: '100%', height: 'auto' }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : null}
                  </>
                );
                return (
                  <div key={article.id} role="listitem" className="retro-window-placeholder w-dyn-item" style={{ height: 'fit-content' }}>
                    <div id="draggable-window" className="retro-window" style={{ height: 'fit-content' }}>
                      <div className="window-bar">
                        <div className="paragraph wide">{publicationName}</div>
                        <div className="x-out">×</div>
                      </div>
                      <div className="window-content-wrapper">
                        {article.url ? (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="window-content w-inline-block"
                          >
                            {contentEl}
                          </a>
                        ) : (
                          <div className="window-content">
                            {contentEl}
                          </div>
                        )}
                      </div>
                      <div className="resize-corner" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}


