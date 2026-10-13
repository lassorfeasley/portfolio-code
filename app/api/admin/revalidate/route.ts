import { requireAdminSession } from '@/lib/auth/admin';
import { handleApiError, json } from '@/lib/api/response';
import { revalidatePublicSite } from '@/lib/revalidate';

export async function POST() {
  try {
    await requireAdminSession();
    revalidatePublicSite();
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
