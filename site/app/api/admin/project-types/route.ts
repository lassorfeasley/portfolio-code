import type { NextRequest } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectTypePayload } from '@/lib/validators/project-types';
import type { ProjectTypePayload } from '@/types/projects';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';

const PROJECT_TYPE_COLUMNS = 'id,name,slug,category,draft,archived,created_at,updated_at';

export async function GET() {
  try {
    await requireAdminSession();
    const adminClient = supabaseServiceRole();
    const { data, error } = await adminClient
      .from('project_types')
      .select(PROJECT_TYPE_COLUMNS)
      .order('name', { ascending: true });

    if (error) {
      throw new ApiError('Failed to load project types', 500, error.message);
    }

    return json({ projectTypes: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = (await request.json()) as ProjectTypePayload;
    const { data, errors } = validateProjectTypePayload(payload);

    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const { data: conflict } = await adminClient
      .from('project_types')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();
    if (conflict) {
      throw new ApiError('Slug already exists.', 409);
    }

    const { data: created, error } = await adminClient
      .from('project_types')
      .insert(data)
      .select(PROJECT_TYPE_COLUMNS)
      .single();

    if (error || !created) {
      throw new ApiError('Failed to create project type', 500, error?.message);
    }

    return json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

