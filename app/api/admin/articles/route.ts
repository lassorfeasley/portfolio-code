import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateArticlePayload } from '@/lib/validators/articles';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { createArticle, listAdminArticles } from '@/lib/domain/articles/service';

export async function GET() {
  try {
    await requireAdminSession();
    const adminClient = supabaseServiceRole();
    const articles = await listAdminArticles(adminClient);
    return json({ articles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const adminClient = supabaseServiceRole();
    const { data, errors } = validateArticlePayload(payload);

    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const created = await createArticle(adminClient, data);
    return json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

