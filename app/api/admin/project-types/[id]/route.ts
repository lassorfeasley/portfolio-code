import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectTypePayload } from '@/lib/validators/project-types';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import {
  deleteProjectType,
  getAdminProjectTypeById,
  updateProjectType,
} from '@/lib/domain/project-types/service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const adminClient = supabaseServiceRole();
    const projectType = await getAdminProjectTypeById(adminClient, id);
    return json(projectType);
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

    const { data, errors } = validateProjectTypePayload({ ...payload, id });
    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const adminClient = supabaseServiceRole();
    const updated = await updateProjectType(adminClient, id, data);
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
    await deleteProjectType(adminClient, id);
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

