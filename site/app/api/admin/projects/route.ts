import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { validateProjectPayload } from '@/lib/validators/projects';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { createProject, listAdminProjects } from '@/lib/domain/projects/service';

export async function GET() {
  try {
    await requireAdminSession();
    const adminClient = supabaseServiceRole();
    const projects = await listAdminProjects(adminClient);
    return json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const payload = await request.json();
    const adminClient = supabaseServiceRole();
    const { data, errors } = validateProjectPayload(payload);

    if (errors) {
      throw new ApiError('Validation failed', 400, errors);
    }

    const created = await createProject(adminClient, data);
    return json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}



