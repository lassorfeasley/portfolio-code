import HomeDesktop, {
  type HomeProject,
  type HomeProjectType,
} from '@/app/(public)/components/HomeDesktop';
import FooterDesktop from '@/app/components/FooterDesktop';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function Home() {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );

  let projects: HomeProject[] = [];
  let projectTypes: HomeProjectType[] = [];
  let statusMessage: string | null = null;

  if (!hasSupabaseEnv) {
    statusMessage = 'Supabase environment variables are not configured. Dynamic project data is unavailable.';
  } else {
    const supabase = supabaseServer();
    const [
      { data: projectData, error: projectError },
      { data: typeData, error: typeError },
    ] = await Promise.all([
      supabase
        .from('projects')
        .select(
          'id,name,slug,description,featured_image_url,year,project_types(name,slug)'
        )
        .eq('draft', false)
        .eq('archived', false)
        .order('published_on', { ascending: false, nullsLast: true }),
      supabase
        .from('project_types')
        .select('id,name,slug,category')
        .eq('draft', false)
        .eq('archived', false)
        .order('name', { ascending: true }),
    ]);

    projects = (projectData ?? []) as HomeProject[];
    projectTypes = (typeData ?? []) as HomeProjectType[];
    statusMessage = projectError?.message ?? typeError?.message ?? null;
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
