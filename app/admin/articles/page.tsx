import Link from 'next/link';
import { requireAdminSession } from '@/lib/auth/admin';
import { AdminShell } from '@/app/admin/components/AdminShell';
import { ArticlesWorkspace } from '@/app/admin/components/articles/ArticlesWorkspace';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { listAdminArticles } from '@/lib/domain/articles/service';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const { session } = await requireAdminSession();
  const email = session.user.email ?? 'unknown';

  const adminClient = supabaseServiceRole();
  try {
    const articles = await listAdminArticles(adminClient);
    return (
      <AdminShell userEmail={email}>
        <ArticlesWorkspace initialArticles={articles} />
      </AdminShell>
    );
  } catch (error) {
    return (
      <AdminShell userEmail={email}>
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Unable to load articles</h1>
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

