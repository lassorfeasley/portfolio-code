import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import {
  listArticlesByProjectId,
  updateArticleProjectAssociations,
} from '@/lib/domain/articles/service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    const articles = await listArticlesByProjectId(adminClient, id);
    return json({ articles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const payload = await request.json();

    if (!Array.isArray(payload.articleIds)) {
      throw new ApiError('articleIds must be an array', 400);
    }

    const adminClient = supabaseServiceRole();
    await updateArticleProjectAssociations(adminClient, id, payload.articleIds);
    
    // Return the updated list
    const articles = await listArticlesByProjectId(adminClient, id);
    return json({ articles });
  } catch (error) {
    return handleApiError(error);
  }
}

