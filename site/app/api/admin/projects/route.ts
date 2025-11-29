import type { NextRequest } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectPayload } from '@/lib/validators/projects';
import type { ProjectPayload } from '@/types/projects';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';

const PROJECT_COLUMNS =
  'id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url,project_type_id,draft,archived,created_at,updated_at';

export async function GET() {
  try {
    await requireAdminSession();
    const adminClient = supabaseServiceRole();
    const { data, error } = await adminClient
      .from('projects')
      .select(PROJECT_COLUMNS)
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw new ApiError('Failed to load projects', 500, error.message);
    }

    return json({ projects: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = (await request.json()) as ProjectPayload;
    const { data, errors } = validateProjectPayload(payload);

    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const { data: conflict } = await adminClient
      .from('projects')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();
    if (conflict) {
      throw new ApiError('Slug already exists.', 409);
    }

    const { data: created, error } = await adminClient
      .from('projects')
      .insert(data)
      .select(PROJECT_COLUMNS)
      .single();

    if (error || !created) {
      throw new ApiError('Failed to create project', 500, error?.message);
    }

    return json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}


