import HomeDesktop from '@/app/(public)/components/HomeDesktop';
import FooterDesktop from '@/app/components/FooterDesktop';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import { getHeroContent } from '@/lib/domain/hero-content/service';
import { getFolderLinks } from '@/lib/domain/folder-links/service';
import { defaultFolderLinks } from '@/lib/domain/folder-links/defaults';
import type { ProjectSummary } from '@/lib/domain/projects/types';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';
import type { HeroContent } from '@/lib/domain/hero-content/types';
import type { FolderLink } from '@/lib/domain/folder-links/types';
import { hasSupabaseEnv } from '@/lib/utils/env';

export const revalidate = false;

export default async function Home() {
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
    [projects, projectTypes, heroContent, folderLinks] = await Promise.all([
      listPublishedProjects(supabase),
      listPublishedProjectTypes(supabase),
      getHeroContent(supabase),
      getFolderLinks(supabase),
    ]);
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
