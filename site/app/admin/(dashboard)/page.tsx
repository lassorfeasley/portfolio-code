import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/admin';
import { AdminShell } from '@/app/admin/components/AdminShell';
import { ProjectsWorkspace } from '@/app/admin/components/projects/ProjectsWorkspace';
import { supabaseServiceRole } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { session } = await requireAdminSession();
  const email = session.user.email ?? 'unknown';

  const adminClient = supabaseServiceRole();
  const [
    { data: projects, error: projectsError },
    { data: projectTypes, error: projectTypesError },
  ] = await Promise.all([
    adminClient
      .from('projects')
      .select(
        'id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url,project_type_id,draft,archived,created_at,updated_at'
      )
      .order('updated_at', { ascending: false, nullsFirst: false }),
    adminClient.from('project_types').select('id,name,slug').order('name', { ascending: true }),
  ]);

  if (projectsError || projectTypesError) {
    return (
      <AdminShell userEmail={email}>
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Unable to load admin data</h1>
          <p className="mt-2 text-muted-foreground">
            {projectsError?.message ?? projectTypesError?.message ?? 'Unknown error'}
          </p>
          <Link href="/" className="mt-4 inline-flex text-sm text-primary underline">
            Return to Lassor.com
          </Link>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell userEmail={email}>
      <ProjectsWorkspace initialProjects={projects ?? []} projectTypes={projectTypes ?? []} />
    </AdminShell>
  );
}


