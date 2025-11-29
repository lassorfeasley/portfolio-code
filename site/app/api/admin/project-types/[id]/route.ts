import type { NextRequest } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectTypePayload } from '@/lib/validators/project-types';
import type { ProjectTypePayload } from '@/types/projects';
import { ApiError, NotFoundError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';

const PROJECT_TYPE_COLUMNS = 'id,name,slug,category,draft,archived,created_at,updated_at';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    const { data, error } = await adminClient
      .from('project_types')
      .select(PROJECT_TYPE_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw new ApiError('Failed to load project type', 500, error.message);
    }
    if (!data) {
      throw new NotFoundError('Project type not found');
    }
    return json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const payload = (await request.json()) as ProjectTypePayload;

    if (payload.id && payload.id !== id) {
      throw new ApiError('Payload id does not match route id.', 400);
    }

    const { data, errors } = validateProjectTypePayload({ ...payload, id });
    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const { data: conflict } = await adminClient
      .from('project_types')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle();
    if (conflict) {
      throw new ApiError('Slug already exists.', 409);
    }

    const { data: updated, error } = await adminClient
      .from('project_types')
      .update(data)
      .eq('id', id)
      .select(PROJECT_TYPE_COLUMNS)
      .single();

    if (error || !updated) {
      throw new ApiError('Failed to update project type', 500, error?.message);
    }

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
    const { error, count } = await adminClient
      .from('project_types')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      throw new ApiError('Failed to delete project type', 500, error.message);
    }
    if (!count) {
      throw new NotFoundError('Project type not found');
    }
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

