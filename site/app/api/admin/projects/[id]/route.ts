import type { NextRequest } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectPayload } from '@/lib/validators/projects';
import type { ProjectPayload } from '@/types/projects';
import { ApiError, NotFoundError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';

const PROJECT_COLUMNS =
  'id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url,project_type_id,draft,archived,created_at,updated_at';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    const { data, error } = await adminClient.from('projects').select(PROJECT_COLUMNS).eq('id', id).maybeSingle();
    if (error) {
      throw new ApiError('Failed to load project', 500, error.message);
    }
    if (!data) {
      throw new NotFoundError('Project not found');
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
    const payload = (await request.json()) as ProjectPayload;

    if (payload.id && payload.id !== id) {
      throw new ApiError('Payload id does not match route id.', 400);
    }

    const { data, errors } = validateProjectPayload({ ...payload, id });
    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const { data: conflict } = await adminClient
      .from('projects')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle();
    if (conflict) {
      throw new ApiError('Slug already exists.', 409);
    }

    const { data: updated, error } = await adminClient
      .from('projects')
      .update(data)
      .eq('id', id)
      .select(PROJECT_COLUMNS)
      .single();

    if (error || !updated) {
      throw new ApiError('Failed to update project', 500, error?.message);
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
    const { error, count } = await adminClient.from('projects').delete({ count: 'exact' }).eq('id', id);
    if (error) {
      throw new ApiError('Failed to delete project', 500, error.message);
    }
    if (!count) {
      throw new NotFoundError('Project not found');
    }
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}


