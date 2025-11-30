import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/admin';
import { AdminShell } from '@/app/admin/components/AdminShell';
import { ProjectTypesWorkspace } from '@/app/admin/components/project-types/ProjectTypesWorkspace';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { listAdminProjectTypes } from '@/lib/domain/project-types/service';

export const dynamic = 'force-dynamic';

export default async function ProjectTypesPage() {
  const { session } = await requireAdminSession();
  const email = session.user.email ?? 'unknown';

  const adminClient = supabaseServiceRole();
  try {
    const projectTypes = await listAdminProjectTypes(adminClient);
    return (
      <AdminShell userEmail={email}>
        <ProjectTypesWorkspace initialProjectTypes={projectTypes} />
      </AdminShell>
    );
  } catch (error) {
    return (
      <AdminShell userEmail={email}>
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Unable to load project types</h1>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Link href="/" className="mt-4 inline-flex text-sm text-primary underline">
            Return to Lassor.com
          </Link>
        </section>
      </AdminShell>
    );
  }
}

