import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/admin';
import { AdminShell } from '@/app/admin/components/AdminShell';
import { ProjectsWorkspace } from '@/app/admin/components/projects/ProjectsWorkspace';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { listAdminProjects } from '@/lib/domain/projects/service';
import { listAdminProjectTypes } from '@/lib/domain/project-types/service';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { session } = await requireAdminSession();
  const email = session.user.email ?? 'unknown';

  const adminClient = supabaseServiceRole();
  try {
    const [projects, projectTypes] = await Promise.all([
      listAdminProjects(adminClient),
      listAdminProjectTypes(adminClient),
    ]);

    return (
      <AdminShell userEmail={email}>
        <ProjectsWorkspace initialProjects={projects} projectTypes={projectTypes} />
      </AdminShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return (
      <AdminShell userEmail={email}>
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Unable to load admin data</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
          <Link href="/" className="mt-4 inline-flex text-sm text-primary underline">
            Return to Lassor.com
          </Link>
        </section>
      </AdminShell>
    );
  }
}


