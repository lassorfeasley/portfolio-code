import type { ProjectTypePayload } from '@/types/projects';

export type ProjectTypeValidationResult = {
  data: Omit<ProjectTypePayload, 'id'>;
  errors: Record<string, string> | null;
};

const slugPattern = /^[a-z0-9-]+$/;

function strOrNull(value?: string | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateProjectTypePayload(input: ProjectTypePayload): ProjectTypeValidationResult {
  const errors: Record<string, string> = {};

  const slug = (input.slug ?? '').trim();
  if (!slug) {
    errors.slug = 'Slug is required.';
  } else if (!slugPattern.test(slug)) {
    errors.slug = 'Slug can only include lowercase letters, numbers, and hyphens.';
  }

  const data: Omit<ProjectTypePayload, 'id'> = {
    name: strOrNull(input.name),
    slug,
    category: strOrNull(input.category),
    draft: Boolean(input.draft),
    archived: Boolean(input.archived),
  };

  return {
    data,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

