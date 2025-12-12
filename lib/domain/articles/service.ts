import { ApiError, NotFoundError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { ArticleWritePayload } from '@/types/projects';
import type { ArticleRow, ArticleSummary } from '@/lib/domain/articles/types';

export async function listPublishedArticles(
  client: TypedSupabaseClient
): Promise<ArticleSummary[]> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('draft', false)
    .eq('archived', false)
    .order('date_published', { ascending: false, nullsFirst: false });

  if (error) {
    throw new ApiError('Failed to load articles', 500, error.message);
  }

  return ((data as unknown as ArticleRow[]) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: row.title,
    publication: row.publication,
    date_published: row.date_published,
    featured_image_url: row.featured_image_url,
    project_id: row.project_id,
    url: row.url,
  }));
}

export async function getPublishedArticleBySlug(
  client: TypedSupabaseClient,
  slug: string
): Promise<ArticleRow> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('draft', false)
    .eq('archived', false)
    .single();

  if (error) {
    throw new ApiError('Failed to load article', 500, error.message);
  }
  if (!data) {
    throw new NotFoundError('Article not found');
  }
  return data as unknown as ArticleRow;
}

export async function listArticleSlugs(client: TypedSupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from('articles')
    .select('slug')
    .eq('draft', false)
    .eq('archived', false);

  if (error) {
    throw new ApiError('Failed to load article slugs', 500, error.message);
  }
  return ((data as unknown as { slug: string }[]) ?? []).map((row) => row.slug);
}

export async function listPublishedArticlesByProjectId(
  client: TypedSupabaseClient,
  projectId: string
): Promise<ArticleSummary[]> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('project_id', projectId)
    .eq('draft', false)
    .eq('archived', false)
    .order('date_published', { ascending: false, nullsFirst: false });

  if (error) {
    // If the column doesn't exist yet, just return empty array
    if (error.message.includes('project_id')) {
      return [];
    }
    throw new ApiError('Failed to load articles for project', 500, error.message);
  }

  return ((data as unknown as ArticleRow[]) ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: row.title,
    publication: row.publication,
    date_published: row.date_published,
    featured_image_url: row.featured_image_url,
    project_id: row.project_id,
    url: row.url,
  }));
}

// Admin functions

export async function listAdminArticles(
  client: TypedSupabaseClient
): Promise<ArticleRow[]> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .order('date_published', { ascending: false, nullsFirst: false });

  if (error) {
    throw new ApiError('Failed to load articles', 500, error.message);
  }

  return (data as unknown as ArticleRow[]) ?? [];
}

export async function getAdminArticleById(
  client: TypedSupabaseClient,
  id: string
): Promise<ArticleRow> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new ApiError('Failed to load article', 500, error.message);
  }
  if (!data) {
    throw new NotFoundError('Article not found');
  }
  return data as unknown as ArticleRow;
}

async function assertArticleSlugAvailable(
  client: TypedSupabaseClient,
  slug: string,
  excludeId?: string | null
) {
  const { data, error } = await client
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  const row = data as unknown as { id: string } | null;
  if (error) {
    throw new ApiError('Failed to validate article slug', 500, error.message);
  }
  if (row && row.id !== excludeId) {
    throw new ApiError('Slug already exists.', 409);
  }
}

export async function createArticle(
  client: TypedSupabaseClient,
  payload: ArticleWritePayload
): Promise<ArticleRow> {
  await assertArticleSlugAvailable(client, payload.slug);
  // Remove project_id if it's null to avoid issues if column doesn't exist yet
  const cleanPayload = { ...payload };
  if (cleanPayload.project_id === null) {
    delete cleanPayload.project_id;
  }
  const { data, error } = await client
    .from('articles')
    .insert(cleanPayload as unknown as never)
    .select('*')
    .single();

  if (error || !data) {
    throw new ApiError('Failed to create article', 500, error?.message);
  }

  return data as unknown as ArticleRow;
}

export async function updateArticle(
  client: TypedSupabaseClient,
  id: string,
  payload: ArticleWritePayload
): Promise<ArticleRow> {
  await assertArticleSlugAvailable(client, payload.slug, id);
  // Remove project_id if it's null to avoid issues if column doesn't exist yet
  const cleanPayload = { ...payload };
  if (cleanPayload.project_id === null) {
    delete cleanPayload.project_id;
  }
  const { data, error } = await client
    .from('articles')
    .update(cleanPayload as unknown as never)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new ApiError('Failed to update article', 500, error?.message);
  }

  return data as unknown as ArticleRow;
}

export async function deleteArticle(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error, count } = await client.from('articles').delete({ count: 'exact' }).eq('id', id);
  if (error) {
    throw new ApiError('Failed to delete article', 500, error.message);
  }
  if (!count) {
    throw new NotFoundError('Article not found');
  }
}

export async function listArticlesByProjectId(
  client: TypedSupabaseClient,
  projectId: string
): Promise<ArticleRow[]> {
  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('project_id', projectId)
    .order('date_published', { ascending: false, nullsFirst: false });

  if (error) {
    // If the column doesn't exist yet, just return empty array
    if (error.message.includes('project_id')) {
      return [];
    }
    throw new ApiError('Failed to load articles for project', 500, error.message);
  }

  return (data as unknown as ArticleRow[]) ?? [];
}

export async function updateArticleProjectAssociations(
  client: TypedSupabaseClient,
  projectId: string,
  articleIds: string[]
): Promise<void> {
  // First, remove all articles from this project
  const { error: clearError } = await client
    .from('articles')
    .update({ project_id: null } as unknown as never)
    .eq('project_id', projectId);

  if (clearError) {
    // If the column doesn't exist yet, skip this operation
    if (!clearError.message.includes('project_id')) {
      throw new ApiError('Failed to clear article associations', 500, clearError.message);
    }
  }

  // Then, associate the specified articles with this project
  if (articleIds.length > 0) {
    const { error: updateError } = await client
      .from('articles')
      .update({ project_id: projectId } as unknown as never)
      .in('id', articleIds);

    if (updateError) {
      throw new ApiError('Failed to update article associations', 500, updateError.message);
    }
  }
}
