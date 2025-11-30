import { ApiError, NotFoundError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { ProjectWritePayload } from '@/types/projects';
import { toProjectDetail, toProjectSummary } from '@/lib/domain/projects/selectors';
import type {
  ProjectDetail,
  ProjectRow,
  ProjectSlugTypeMap,
  ProjectSummary,
  ProjectWithTypeRelation,
} from '@/lib/domain/projects/types';

const PROJECT_COLUMNS =
  'id,name,slug,description,featured_image_url,images_urls,process_image_urls,process_images_label,process_and_context_html,year,linked_document_url,video_url,fallback_writing_url,project_type_id,draft,archived,created_at,updated_at,published_on';

const PROJECT_WITH_TYPE_COLUMNS = `${PROJECT_COLUMNS},project_types(id,name,slug,category,landing_page_credentials,font_awesome_icon)`;

export async function listPublishedProjects(
  client: TypedSupabaseClient
): Promise<ProjectSummary[]> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_WITH_TYPE_COLUMNS)
    .eq('draft', false)
    .eq('archived', false)
    .order('published_on', { ascending: false, nullsFirst: false });

  if (error) {
    throw new ApiError('Failed to load projects', 500, error.message);
  }

  return ((data as unknown as ProjectWithTypeRelation[]) ?? []).map((row) => toProjectSummary(row as ProjectWithTypeRelation));
}

export async function listPublishedProjectsByType(
  client: TypedSupabaseClient,
  projectTypeId: string
): Promise<ProjectSummary[]> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_WITH_TYPE_COLUMNS)
    .eq('project_type_id', projectTypeId)
    .eq('draft', false)
    .eq('archived', false)
    .order('published_on', { ascending: false, nullsFirst: false });

  if (error) {
    throw new ApiError('Failed to load projects for project type', 500, error.message);
  }

  return ((data as unknown as ProjectWithTypeRelation[]) ?? []).map((row) => toProjectSummary(row as ProjectWithTypeRelation));
}

export async function getPublishedProjectBySlug(
  client: TypedSupabaseClient,
  slug: string
): Promise<ProjectDetail> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_WITH_TYPE_COLUMNS)
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error) {
    throw new ApiError('Failed to load project', 500, error.message);
  }
  if (!data) {
    throw new NotFoundError('Project not found');
  }

  return toProjectDetail(data as unknown as ProjectWithTypeRelation);
}

export async function listPublicProjectSlugs(client: TypedSupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from('projects')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);

  if (error) {
    throw new ApiError('Failed to load project slugs', 500, error.message);
  }

  return ((data as unknown as { slug: string }[]) ?? []).map((row) => row.slug);
}

export async function listAdminProjects(
  client: TypedSupabaseClient
): Promise<ProjectRow[]> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_COLUMNS)
    .order('updated_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new ApiError('Failed to load projects', 500, error.message);
  }

  return (data as unknown as ProjectRow[]) ?? [];
}

export async function getAdminProjectById(
  client: TypedSupabaseClient,
  id: string
): Promise<ProjectRow> {
  const { data, error } = await client
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new ApiError('Failed to load project', 500, error.message);
  }
  if (!data) {
    throw new NotFoundError('Project not found');
  }

  return data as unknown as ProjectRow;
}

async function assertProjectSlugAvailable(
  client: TypedSupabaseClient,
  slug: string,
  excludeId?: string | null
) {
  const query = client.from('projects').select('id').eq('slug', slug).maybeSingle();
  const { data: queryData, error } = await query;
  const row = queryData as unknown as { id: string } | null;
  if (error) {
    throw new ApiError('Failed to validate project slug', 500, error.message);
  }
  if (row && row.id !== excludeId) {
    throw new ApiError('Slug already exists.', 409);
  }
}

export async function createProject(
  client: TypedSupabaseClient,
  payload: ProjectWritePayload
): Promise<ProjectRow> {
  await assertProjectSlugAvailable(client, payload.slug);
  const { data, error } = await client
    .from('projects')
    .insert(payload as unknown as never)
    .select(PROJECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError('Failed to create project', 500, error?.message);
  }

  return data as unknown as ProjectRow;
}

export async function updateProject(
  client: TypedSupabaseClient,
  id: string,
  payload: ProjectWritePayload
): Promise<ProjectRow> {
  await assertProjectSlugAvailable(client, payload.slug, id);
  const { data, error } = await client
    .from('projects')
    .update(payload as unknown as never)
    .eq('id', id)
    .select(PROJECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError('Failed to update project', 500, error?.message);
  }

  return data as unknown as ProjectRow;
}

export async function deleteProject(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error, count } = await client.from('projects').delete({ count: 'exact' }).eq('id', id);
  if (error) {
    throw new ApiError('Failed to delete project', 500, error.message);
  }
  if (!count) {
    throw new NotFoundError('Project not found');
  }
}

export async function buildProjectSlugTypeMap(
  client: TypedSupabaseClient
): Promise<ProjectSlugTypeMap> {
  const { data, error } = await client
    .from('projects')
    .select('slug,project_types!inner(slug)')
    .eq('draft', false)
    .eq('archived', false);

  if (error) {
    throw new ApiError('Failed to build project map', 500, error.message);
  }

  const map: ProjectSlugTypeMap = {};
  for (const row of (data as unknown as ProjectWithTypeRelation[]) ?? []) {
    const rel = (row as ProjectWithTypeRelation).project_types;
    if (!row.slug) continue;
    if (Array.isArray(rel)) {
      map[row.slug] = rel[0]?.slug ?? '';
    } else if (rel && typeof rel === 'object') {
      map[row.slug] = rel.slug ?? '';
    } else {
      map[row.slug] = '';
    }
  }
  return map;
}
