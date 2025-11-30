import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { updateFolderLink, createFolderLink, deleteFolderLink, listFolderLinks } from '@/lib/domain/folder-links/service';
import { revalidatePath } from 'next/cache';

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const links = await request.json();
    
    const adminClient = supabaseServiceRole();
    
    // Get existing links to determine which to delete
    const existingLinks = await listFolderLinks(adminClient);
    const incomingIds = links.map((link: any) => link.id).filter((id: string) => !id.startsWith('temp-'));
    
    // Delete links that are no longer in the incoming list
    const toDelete = existingLinks.filter(existing => !incomingIds.includes(existing.id));
    await Promise.all(toDelete.map(link => deleteFolderLink(adminClient, link.id)));
    
    // Update or create each link
    const results = await Promise.all(
      links.map((link: any) => {
        if (link.id.startsWith('temp-')) {
          // New link
          return createFolderLink(adminClient, {
            label: link.label,
            icon: link.icon,
            href: link.href,
            external: link.external,
            displayOrder: link.displayOrder,
          });
        } else {
          // Existing link
          return updateFolderLink(adminClient, link.id, {
            label: link.label,
            icon: link.icon,
            href: link.href,
            external: link.external,
            displayOrder: link.displayOrder,
          });
        }
      })
    );

    revalidatePath('/');
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating folder links:', error);
    return NextResponse.json(
      { error: 'Failed to update folder links' },
      { status: 500 }
    );
  }
}

