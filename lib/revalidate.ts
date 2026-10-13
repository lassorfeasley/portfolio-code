import { revalidatePath } from 'next/cache';

// Public pages are fully static; every page shares folder links and project data, so refresh all of them.
export function revalidatePublicSite() {
  revalidatePath('/', 'layout');
}
