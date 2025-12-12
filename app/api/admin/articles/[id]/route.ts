import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateArticlePayload } from '@/lib/validators/articles';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import {
  deleteArticle,
  getAdminArticleById,
  updateArticle,
} from '@/lib/domain/articles/service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    const article = await getAdminArticleById(adminClient, id);
    return json(article);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const payload = await request.json();

    if (payload.id && payload.id !== id) {
      throw new ApiError('Payload id does not match route id.', 400);
    }

    const { data, errors } = validateArticlePayload({ ...payload, id });
    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const updated = await updateArticle(adminClient, id, data);
    return json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    await deleteArticle(adminClient, id);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

