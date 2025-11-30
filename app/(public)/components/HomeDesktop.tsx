'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ImageWithSupabaseFallback from '@/app/components/ImageWithSupabaseFallback';
import RetroWindow from '@/app/components/RetroWindow';
import type { ProjectSummary } from '@/lib/domain/projects/types';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';

type HomeDesktopProps = {
  projects: ProjectSummary[];
  projectTypes: ProjectTypeSummary[];
  statusMessage?: string | null;
};

const HERO_IMAGE =
  'https://cdn.prod.website-files.com/5e9a6fed9ba599718ff8fdb0/67e33283b8d549afbb87ff55_1658416295792-1.jpeg';

const folderLinks = [
  { label: 'UI design', icon: '', href: '/project-types/interaction-design' },
  { label: 'Writing', icon: '', href: '/project-types/writing' },
  { label: 'Resume', icon: '', href: 'https://docs.google.com/document/d/1qz8Qwrk6aoD1n1vEe5Zd7OhaEhun8UOuY0xcW2SnRmg/edit?tab=t.0', external: true },
  { label: 'UX design', icon: '', href: '/project-types/innovation' },
  { label: 'Walking forward', icon: '', href: 'https://walking.lassor.com', external: true },
  { label: 'LinkedIn', icon: '', href: 'https://www.linkedin.com/in/lassor/', external: true },
  { label: 'Industrial design', icon: '', href: '/project-types/industrial-design' },
  { label: 'Seatback Safety', icon: '', href: 'https://www.lassor.com/projects/seatback-safety', external: true },
];

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

type ProjectWithMeta = ProjectSummary & {
  _typeSlug: string | null;
  _typeName: string | null;
};

export default function HomeDesktop({ projects, projectTypes, statusMessage }: HomeDesktopProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const preparedProjects = useMemo<ProjectWithMeta[]>(
    () =>
      projects.map((project) => ({
        ...project,
        _typeSlug: project.projectType?.slug ?? null,
        _typeName: project.projectType?.name ?? null,
      })),
    [projects]
  );

  const filterOptions = useMemo(() => {
    const sorted = [...projectTypes].filter((type) => Boolean(type.slug));
    sorted.sort((a, b) => {
      const left = (a.name ?? a.slug ?? '').toLowerCase();
      const right = (b.name ?? b.slug ?? '').toLowerCase();
      return left.localeCompare(right);
    });
    return [{ label: 'All projects', slug: null }, ...sorted.map((type) => ({ label: type.name ?? type.slug ?? '', slug: type.slug! }))];
  }, [projectTypes]);

  const filteredProjects = useMemo<ProjectWithMeta[]>(() => {
    const term = normalize(searchTerm || '');
    return preparedProjects.filter((project) => {
      const text = `${project.name ?? ''} ${project.description ?? ''}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      const matchesCategory = !activeCategory || project._typeSlug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [preparedProjects, searchTerm, activeCategory]);

  const handleFilterClick = (slug: string | null) => {
    setActiveCategory((current) => (current === slug ? null : slug));
  };

  // Trigger scatter effect after projects render
  useEffect(() => {
    if (filteredProjects.length === 0) return;
    
    // Wait for React to finish rendering, then trigger scatter with retries
    const triggerScatter = () => {
      if (typeof window.retroApplyScatterEffect === 'function') {
        const containers = document.querySelectorAll('.cluttered-desktop-container');
        if (containers.length > 0) {
          window.retroApplyScatterEffect();
        }
      }
    };
    
    // Try immediately after render
    const timeoutId1 = setTimeout(triggerScatter, 100);
    
    // Retry after a longer delay for production builds
    const timeoutId2 = setTimeout(triggerScatter, 500);
    
    // Final retry after even longer delay
    const timeoutId3 = setTimeout(triggerScatter, 1500);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [filteredProjects.length]);

  // Trigger pixel effect re-initialization after projects render
  useEffect(() => {
    if (filteredProjects.length === 0) return;
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const maxAttempts = 50; // Try for up to ~10 seconds (50 * 200ms)
    let intervalId: NodeJS.Timeout | null = null;
    
    const triggerPixelEffect = () => {
      // Check if the specific function from visual-effects.js is available
      if (typeof window.__pixelImageEffectReinit === 'function') {
        window.__pixelImageEffectReinit();
        // Once successfully called, we can stop polling
        if (intervalId) clearInterval(intervalId);
      } else {
        // If not ready, dispatch the event as a fallback (in case script is listening but didn't expose global yet)
        // But mainly we rely on the polling
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('retroPixelEffectReinitRequest'));
        }

        attempts++;
        if (attempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId);
          console.warn('[HomeDesktop] Gave up waiting for pixel effect script after 10s');
        }
      }
    };

    // Start polling every 200ms
    intervalId = setInterval(triggerPixelEffect, 200);

    // Try immediately once just in case
    triggerPixelEffect();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [filteredProjects.length]);

  const emptyStateMessage =
    projects.length === 0
      ? 'No projects are available yet. Add one in the admin dashboard to populate this space.'
      : 'No projects match your current filters.';

  return (
    <div className="globalmargin">
      <header className="topbar w-nav">
        <div className="h _10 wide" style={{ display: 'flex', alignItems: 'center' }}>
          <LassorGlyph />
          <div className="paragraph header">LassorOS</div>
        </div>
        <div className="h _15">
          <a href="tel:9178434496" className="link-block-3 w-inline-block">
            <div className="icon"></div>
          </a>
          <a href="https://meetings.hubspot.com/lfeasley" target="_blank" rel="noreferrer" className="link-block-3 w-inline-block">
            <div className="icon"></div>
          </a>
          <a href="mailto:feasley@lassor.com?subject=Positive%20vibes" className="link-block-3 w-inline-block">
            <div className="icon"></div>
          </a>
        </div>
      </header>

      <section className="windowcanvas twoonegrid">
        <div className="retro-window-placeholder">
          <RetroWindow title="Lassor_headshot.jpg" className="homepage" variant="nomax">
            <>
              <div className="paragraph homepage">
                Hi! I am Lassor Feasley. I am a product designer, entrepreneur, and the cofounder and CEO of Renewables.org, the solar crowdfunding
                nonprofit. Take a look around!
              </div>
              <Image
                src={HERO_IMAGE}
                alt="Portrait of Lassor Feasley"
                className="image-2 max-with"
                width={800}
                height={800}
                sizes="(max-width: 768px) 90vw, 400px"
                priority={false}
              />
              <Link href="/faceblind" className="link-block-4 w-inline-block">
                <div className="navlink light">Lassor is face-blind. Learn more →</div>
              </Link>
            </>
          </RetroWindow>
        </div>
        <div className="align-right">
          <FolderGrid />
        </div>
      </section>

      <section className="windowcanvas search">
        <div className="h search">
          <form className="form-block w-form" onSubmit={(event) => event.preventDefault()}>
            <input
              className="search jetboost-list-search-input-lkmq w-input"
              maxLength={256}
              name="search"
              placeholder="Search projects"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <input type="submit" value="Search" className="submit-button w-button" />
          </form>
          <div className="jetboost-filter-wzyl w-dyn-list">
            <div className="h _15 wrap w-dyn-items">
              {filterOptions.map((option) => (
                <button
                  key={option.slug ?? 'all'}
                  type="button"
                  onClick={() => handleFilterClick(option.slug)}
                  className={`button w-button${activeCategory === option.slug ? ' is-active jetboost-filter-active' : ''}`}
                  aria-pressed={activeCategory === option.slug}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <div className="windowcanvas">
          <div className="retro-window-placeholder">
            <RetroWindow title="Status" disableDrag disableResize>
              <div className="paragraph">{statusMessage}</div>
            </RetroWindow>
          </div>
        </div>
      ) : null}

      <section className="windowcanvas">
        <div className="jetboost-list-wrapper-lkmq jetboost-list-wrapper-wzyl w-dyn-list">
          <div role="list" className="cluttered-desktop-container w-dyn-items">
            {filteredProjects.length === 0 ? (
              <div className="retro-window-placeholder w-dyn-item">
                <RetroWindow title="Nothing to show" disableDrag disableResize>
                  <div className="paragraph">{emptyStateMessage}</div>
                </RetroWindow>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id ?? project.slug} role="listitem" className="retro-window-placeholder w-dyn-item">
                  <RetroWindow title={project.name ?? 'Untitled project'}>
                    <div className="v _5">
                      {project.description ? <div className="paragraph mxht">{project.description}</div> : null}
                    <div className="paragraph mxht learn-more">
                      <Link href={`/work/${project.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        learn more →
                      </Link>
                    </div>
                    </div>
                    {project.featured_image_url ? (
                      <ImageWithSupabaseFallback
                        src={project.featured_image_url}
                        alt={project.name ?? ''}
                        className="maxw450px"
                        style={{ width: '100%', height: 'auto' }}
                      />
                    ) : null}
                  </RetroWindow>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FolderGrid() {
  return (
    <div className="folder-grid">
      {folderLinks.map((link) => (
        <div key={link.label} className="icon-placeholder">
          <div className="draggable-folder">
            {link.external ? (
              <a href={link.href} target="_blank" rel="noreferrer" className="iconlink w-inline-block">
                <FolderLinkContent icon={link.icon} label={link.label} />
              </a>
            ) : (
              <Link href={link.href} className="iconlink w-inline-block">
                <FolderLinkContent icon={link.icon} label={link.label} />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FolderLinkContent({ icon, label }: { icon: string; label: string }) {
  return (
    <>
      <div className="folder">{icon}</div>
      <div className="navlink foldericon">{label}</div>
    </>
  );
}

function LassorGlyph() {
  return (
    <span style={{ width: 24, height: 24, marginRight: 8, display: 'inline-block', lineHeight: 0 }}>
      <svg width="24" height="24" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_899_152)">
          <path
            d="M0 2.15625C0 0.984375 0.960938 0 2.15625 0C3.32812 0 4.3125 0.984375 4.3125 2.15625V3.1875H7.6875V2.15625C7.6875 0.984375 8.64844 0 9.84375 0C11.0156 0 12 0.984375 12 2.15625V2.25C12 3.49219 10.9922 4.5 9.75 4.5H8.8125V7.5H9.75C10.9922 7.5 12 8.50781 12 9.75V9.84375C12 11.0391 11.0156 12 9.84375 12C8.64844 12 7.6875 11.0391 7.6875 9.84375V8.8125H4.3125V9.84375C4.3125 11.0391 3.32812 12 2.15625 12C0.960938 12 0 11.0391 0 9.84375V9.75C0 8.50781 1.00781 7.5 2.25 7.5H3.1875V4.5H2.25C1.00781 4.5 0 3.49219 0 2.25V2.15625ZM3.1875 3.375V3.1875V2.15625C3.1875 1.59375 2.71875 1.125 2.15625 1.125C1.57031 1.125 1.125 1.59375 1.125 2.15625V2.25C1.125 2.88281 1.61719 3.375 2.25 3.375H3.1875ZM4.3125 7.5V7.6875H7.6875V7.5V4.5V4.3125H4.3125V4.5V7.5ZM3.1875 8.625H2.25C1.61719 8.625 1.125 9.14062 1.125 9.75V9.84375C1.125 10.4297 1.57031 10.875 2.15625 10.875C2.71875 10.875 3.1875 10.4297 3.1875 9.84375V8.8125V8.625ZM8.8125 8.8125V9.84375C8.8125 10.4297 9.25781 10.875 9.84375 10.875C10.4062 10.875 10.875 10.4297 10.875 9.84375V9.75C10.875 9.14062 10.3594 8.625 9.75 8.625H8.8125V8.8125ZM8.8125 3.375H9.75C10.3594 3.375 10.875 2.88281 10.875 2.25V2.15625C10.875 1.59375 10.4062 1.125 9.84375 1.125C9.25781 1.125 8.8125 1.59375 8.8125 2.15625V3.1875V3.375Z"
            fill="#262626"
          />
        </g>
        <defs>
          <clipPath id="clip0_899_152">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </span>
  );
}

