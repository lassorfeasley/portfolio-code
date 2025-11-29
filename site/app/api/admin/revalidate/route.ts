import type { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdminSession } from '@/lib/auth/admin';
import { handleApiError, json } from '@/lib/api/response';

type Payload = {
  paths?: string[];
  tags?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = (await request.json()) as Payload;
    const paths = Array.isArray(body.paths) ? body.paths : [];
    const tags = Array.isArray(body.tags) ? body.tags : [];

    paths.forEach((path) => {
      if (typeof path === 'string' && path.startsWith('/')) {
        revalidatePath(path);
      }
    });
    tags.forEach((tag) => {
      if (typeof tag === 'string' && tag.length > 0) {
        revalidateTag(tag);
      }
    });

    return json({ success: true, paths, tags });
  } catch (error) {
    return handleApiError(error);
  }
}



