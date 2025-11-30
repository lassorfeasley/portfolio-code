import { requireAdminSession } from '@/lib/auth/admin';
import { AdminShell } from '@/app/admin/components/AdminShell';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { getHeroContent } from '@/lib/domain/hero-content/service';
import { listFolderLinks } from '@/lib/domain/folder-links/service';
import { HomepageEditor } from '@/app/admin/components/homepage/HomepageEditor';

export const dynamic = 'force-dynamic';

export default async function HomepageAdminPage() {
  const { session } = await requireAdminSession();
  const email = session.user.email ?? 'unknown';

  const adminClient = supabaseServiceRole();
  
  try {
    const [heroContent, folderLinks] = await Promise.all([
      getHeroContent(adminClient),
      listFolderLinks(adminClient),
    ]);

    return (
      <AdminShell userEmail={email}>
        <HomepageEditor 
          initialHeroContent={heroContent} 
          initialFolderLinks={folderLinks} 
        />
      </AdminShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return (
      <AdminShell userEmail={email}>
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Unable to load homepage data</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </section>
      </AdminShell>
    );
  }
}

