import HomeDesktop from '@/app/(public)/components/HomeDesktop';
import FooterDesktop from '@/app/components/FooterDesktop';
import { supabaseServer } from '@/lib/supabase/server';
import { listPublishedProjects } from '@/lib/domain/projects/service';
import { listPublishedProjectTypes } from '@/lib/domain/project-types/service';
import type { ProjectSummary } from '@/lib/domain/projects/types';
import type { ProjectTypeSummary } from '@/lib/domain/project-types/types';
import { hasSupabaseEnv } from '@/lib/utils/env';

export const revalidate = 60;

export default async function Home() {
  const envConfigured = hasSupabaseEnv();

  let projects: ProjectSummary[] = [];
  let projectTypes: ProjectTypeSummary[] = [];
  let statusMessage: string | null = null;

  if (!envConfigured) {
    statusMessage = 'Supabase environment variables are not configured. Dynamic project data is unavailable.';
  } else {
    const supabase = supabaseServer();
    try {
      const [projectData, typeData] = await Promise.all([
        listPublishedProjects(supabase),
        listPublishedProjectTypes(supabase),
      ]);
      projects = projectData;
      projectTypes = typeData;
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : 'Failed to load project data.';
    }
  }

  return (
    <main className="retro-root">
      <HomeDesktop
        projects={projects}
        projectTypes={projectTypes}
        statusMessage={statusMessage}
      />
      <FooterDesktop />
    </main>
  );
}
