import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectTypePayload } from '@/lib/validators/project-types';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { createProjectType, listAdminProjectTypes } from '@/lib/domain/project-types/service';

export async function GET() {
  try {
    await requireAdminSession();
    const adminClient = supabaseServiceRole();
    const projectTypes = await listAdminProjectTypes(adminClient);
    return json({ projectTypes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const adminClient = supabaseServiceRole();
    const { data, errors } = validateProjectTypePayload(payload);

    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const created = await createProjectType(adminClient, data);
    return json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

