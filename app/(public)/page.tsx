import HomeDesktop from '@/app/(public)/components/HomeDesktop';
import FooterDesktop from '@/app/components/FooterDesktop';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import { getHeroContent } from '@/lib/domain/hero-content/service';
import { listFolderLinks } from '@/lib/domain/folder-links/service';
import type { ProjectSummary } from '@/lib/domain/projects/types';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';
import type { HeroContent } from '@/lib/domain/hero-content/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import { hasSupabaseEnv } from '@/lib/utils/env';
import { redirect } from 'next/navigation';

export const revalidate = 60;

// Fallback data for folder links if database is empty
const defaultFolderLinks: FolderLink[] = [
  { id: '1', label: 'UI design', icon: '\uf245', href: '/project-types/interaction-design', external: false, displayOrder: 1 },
  { id: '2', label: 'Writing', icon: '\uf5ad', href: '/project-types/writing', external: false, displayOrder: 2 },
  { id: '3', label: 'Resume', icon: '\uf15b', href: 'https://docs.google.com/document/d/1qz8Qwrk6aoD1n1vEe5Zd7OhaEhun8UOuY0xcW2SnRmg/edit?tab=t.0', external: true, displayOrder: 3 },
  { id: '4', label: 'UX design', icon: '\uf06e', href: '/project-types/innovation', external: false, displayOrder: 4 },
  { id: '5', label: 'Walking forward', icon: '\uf54b', href: 'https://walking.lassor.com', external: true, displayOrder: 5 },
  { id: '6', label: 'LinkedIn', icon: '\uf0c1', href: 'https://www.linkedin.com/in/lassor/', external: true, displayOrder: 6 },
  { id: '7', label: 'Industrial design', icon: '\uf546', href: '/project-types/industrial-design', external: false, displayOrder: 7 },
  { id: '8', label: 'Seatback Safety', icon: '\uf072', href: 'https://www.lassor.com/projects/seatback-safety', external: true, displayOrder: 8 },
];

export default async function Home(props: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await props.searchParams;

  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}&next=/admin/reset-password`);
  }

  const envConfigured = hasSupabaseEnv();

  let projects: ProjectSummary[] = [];
  let projectTypes: ProjectTypeSummary[] = [];
  let heroContent: HeroContent | null = null;
  let folderLinks: FolderLink[] = defaultFolderLinks;
  let statusMessage: string | null = null;

  if (!envConfigured) {
    statusMessage = 'Supabase environment variables are not configured. Dynamic project data is unavailable.';
  } else {
    const supabase = supabaseServer();
    try {
      const [projectData, typeData, hero, links] = await Promise.all([
        listPublishedProjects(supabase),
        listPublishedProjectTypes(supabase),
        getHeroContent(supabase),
        listFolderLinks(supabase),
      ]);
      projects = projectData;
      projectTypes = typeData;
      heroContent = hero;
      // Only use database links if we got some, otherwise keep defaults
      if (links && links.length > 0) {
        console.log('🔍 page.tsx - Using database folder links:', links);
        links.forEach((link, index) => {
          console.log(`🔍 page.tsx - DB Link ${index}:`, {
            id: link.id,
            label: link.label,
            icon: link.icon,
            iconType: typeof link.icon,
            iconLength: link.icon?.length,
            iconCharCodes: link.icon ? Array.from(link.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
            iconJSON: JSON.stringify(link.icon),
          });
        });
        
        // Merge database links with default icons when icon is empty
        // Create a map of default icons by label for quick lookup
        const defaultIconMap = new Map(defaultFolderLinks.map(link => [link.label, link.icon]));
        const defaultIconMapByHref = new Map(defaultFolderLinks.map(link => [link.href, link.icon]));
        
        folderLinks = links.map(link => {
          // If icon is empty or whitespace, try to get from defaults
          if (!link.icon || link.icon.trim().length === 0) {
            const defaultIcon = defaultIconMap.get(link.label) || defaultIconMapByHref.get(link.href);
            if (defaultIcon) {
              console.log(`🔍 page.tsx - Merging default icon for "${link.label}":`, {
                defaultIcon,
                iconType: typeof defaultIcon,
                iconLength: defaultIcon.length,
                iconCharCodes: Array.from(defaultIcon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`),
                iconJSON: JSON.stringify(defaultIcon),
              });
              return { ...link, icon: defaultIcon };
            } else {
              console.log(`🔍 page.tsx - No default icon found for "${link.label}" (href: ${link.href})`);
            }
          }
          return link;
        });
        
        // Log final merged result
        console.log('🔍 page.tsx - Final merged folderLinks:', folderLinks);
        folderLinks.forEach((link, index) => {
          console.log(`🔍 page.tsx - Final Link ${index}:`, {
            id: link.id,
            label: link.label,
            icon: link.icon,
            iconType: typeof link.icon,
            iconLength: link.icon?.length,
            iconCharCodes: link.icon ? Array.from(link.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
            iconJSON: JSON.stringify(link.icon),
          });
        });
      } else {
        console.log('🔍 page.tsx - Using default folder links (no DB links found)');
        console.log('🔍 page.tsx - Default links:', defaultFolderLinks);
        defaultFolderLinks.forEach((link, index) => {
          console.log(`🔍 page.tsx - Default Link ${index}:`, {
            id: link.id,
            label: link.label,
            icon: link.icon,
            iconType: typeof link.icon,
            iconLength: link.icon?.length,
            iconCharCodes: link.icon ? Array.from(link.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
            iconJSON: JSON.stringify(link.icon),
          });
        });
        folderLinks = defaultFolderLinks;
      }
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : 'Failed to load project data.';
    }
  }

  return (
    <main className="retro-root">
      <HomeDesktop
        projects={projects}
        projectTypes={projectTypes}
        heroContent={heroContent}
        folderLinks={folderLinks}
        statusMessage={statusMessage}
      />
      <FooterDesktop folderLinks={folderLinks} />
    </main>
  );
}
