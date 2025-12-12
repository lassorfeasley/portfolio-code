import type { ArticlePayload } from '@/types/projects';

export type ArticleValidationResult = {
  data: Omit<ArticlePayload, 'id'>;
  errors: Record<string, string> | null;
};

const slugPattern = /^[a-z0-9-]+$/;

function strOrNull(value?: string | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateArticlePayload(input: ArticlePayload): ArticleValidationResult {
  const errors: Record<string, string> = {};

  const slug = (input.slug ?? '').trim();
  if (!slug) {
    errors.slug = 'Slug is required.';
  } else if (!slugPattern.test(slug)) {
    errors.slug = 'Slug can only include lowercase letters, numbers, and hyphens.';
  }

  const data: Omit<ArticlePayload, 'id'> = {
    name: strOrNull(input.name),
    slug,
    title: strOrNull(input.title),
    publication: strOrNull(input.publication),
    date_published: strOrNull(input.date_published),
    featured_image_url: strOrNull(input.featured_image_url),
    url: strOrNull(input.url),
    project_id: input.project_id ?? null,
    draft: Boolean(input.draft),
    archived: Boolean(input.archived),
  };

  return {
    data,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

