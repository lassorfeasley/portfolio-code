import { ApiError, NotFoundError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { ProjectTypeWritePayload } from '@/types/projects';
import { toProjectTypeDetail, toProjectTypeSummary } from '@/lib/domain/project-types/selectors';
import type { ProjectTypeDetail, ProjectTypeRow, ProjectTypeSummary } from '@/lib/domain/project-types/types';

const PROJECT_TYPE_COLUMNS =
  'id,name,slug,category,landing_page_credentials,font_awesome_icon,draft,archived,created_at,updated_at';

export async function listPublishedProjectTypes(
  client: TypedSupabaseClient
): Promise<ProjectTypeSummary[]> {
  const { data, error } = await client
    .from('project_types')
    .select(PROJECT_TYPE_COLUMNS)
    .eq('draft', false)
    .eq('archived', false)
    .order('name', { ascending: true });

  if (error) {
    throw new ApiError('Failed to load project types', 500, error.message);
  }

  return ((data as unknown as ProjectTypeRow[]) ?? []).map((row) => toProjectTypeSummary(row));
}

export async function listAdminProjectTypes(
  client: TypedSupabaseClient
): Promise<ProjectTypeRow[]> {
  const { data, error } = await client
    .from('project_types')
    .select(PROJECT_TYPE_COLUMNS)
    .order('name', { ascending: true });

  if (error) {
    throw new ApiError('Failed to load project types', 500, error.message);
  }

  return (data as unknown as ProjectTypeRow[]) ?? [];
}

export async function getAdminProjectTypeById(
  client: TypedSupabaseClient,
  id: string
): Promise<ProjectTypeRow> {
  const { data, error } = await client
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
  return data as unknown as ProjectTypeRow;
}

export async function getPublishedProjectTypeBySlug(
  client: TypedSupabaseClient,
  slug: string
): Promise<ProjectTypeDetail> {
  const { data, error } = await client
    .from('project_types')
    .select(PROJECT_TYPE_COLUMNS)
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error) {
    throw new ApiError('Failed to load project type', 500, error.message);
  }
  if (!data) {
    throw new NotFoundError('Project type not found');
  }

  return toProjectTypeDetail(data as unknown as ProjectTypeRow);
}

export async function listProjectTypeSlugs(
  client: TypedSupabaseClient
): Promise<string[]> {
  const { data, error } = await client
    .from('project_types')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);

  if (error) {
    throw new ApiError('Failed to load project type slugs', 500, error.message);
  }
  return ((data as unknown as { slug: string }[]) ?? []).map((row) => row.slug);
}

async function assertProjectTypeSlugAvailable(
  client: TypedSupabaseClient,
  slug: string,
  excludeId?: string | null
) {
  const { data, error } = await client
    .from('project_types')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  const row = data as unknown as { id: string } | null;
  if (error) {
    throw new ApiError('Failed to validate project type slug', 500, error.message);
  }
  if (row && row.id !== excludeId) {
    throw new ApiError('Slug already exists.', 409);
  }
}

export async function createProjectType(
  client: TypedSupabaseClient,
  payload: ProjectTypeWritePayload
): Promise<ProjectTypeRow> {
  await assertProjectTypeSlugAvailable(client, payload.slug);
  const { data, error } = await client
    .from('project_types')
    .insert(payload as unknown as never)
    .select(PROJECT_TYPE_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError('Failed to create project type', 500, error?.message);
  }

  return data as unknown as ProjectTypeRow;
}

export async function updateProjectType(
  client: TypedSupabaseClient,
  id: string,
  payload: ProjectTypeWritePayload
): Promise<ProjectTypeRow> {
  await assertProjectTypeSlugAvailable(client, payload.slug, id);
  const { data, error } = await client
    .from('project_types')
    .update(payload as unknown as never)
    .eq('id', id)
    .select(PROJECT_TYPE_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError('Failed to update project type', 500, error?.message);
  }

  return data as unknown as ProjectTypeRow;
}

export async function deleteProjectType(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error, count } = await client.from('project_types').delete({ count: 'exact' }).eq('id', id);
  if (error) {
    throw new ApiError('Failed to delete project type', 500, error.message);
  }
  if (!count) {
    throw new NotFoundError('Project type not found');
  }
}
