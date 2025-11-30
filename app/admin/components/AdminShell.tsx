'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, PanelsTopLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type AdminShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

const navigation = [
  { href: '/admin', label: 'Projects' },
  { href: '/admin/project-types', label: 'Project Types' },
  { href: '/admin/homepage', label: 'Homepage' },
];

export function AdminShell({ userEmail, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Signed out');
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-r bg-card">
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <PanelsTopLeft className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-tight">Lassor Admin</p>
            <p className="text-xs text-muted-foreground">Manage portfolio</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navigation.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="justify-start"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto px-4 pb-6 pt-2 border-t">
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <p className="font-medium">Signed in as</p>
            <p className="truncate text-muted-foreground">{userEmail}</p>
          </div>
          <Button variant="outline" className="mt-4 w-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex w-full flex-col bg-muted/5 py-8">
        <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-10">{children}</div>
      </main>
    </div>
  );
}


