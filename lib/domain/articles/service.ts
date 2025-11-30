import { ApiError, NotFoundError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
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
