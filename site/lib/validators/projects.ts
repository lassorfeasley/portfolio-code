import type { ProjectPayload, ProjectWritePayload } from '@/types/projects';

export type ProjectValidationResult = {
  data: ProjectWritePayload;
  errors: Record<string, string> | null;
};

const slugPattern = /^[a-z0-9-]+$/;

function strOrNull(value?: string | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrlArray(values?: string[] | null): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

export function validateProjectPayload(input: ProjectPayload): ProjectValidationResult {
  const errors: Record<string, string> = {};

  const slug = (input.slug ?? '').trim();
  if (!slug) {
    errors.slug = 'Slug is required.';
  } else if (!slugPattern.test(slug)) {
    errors.slug = 'Slug can only include lowercase letters, numbers, and hyphens.';
  }

  const projectTypeId = (input.project_type_id ?? '').toString().trim();
  const data: ProjectWritePayload = {
    name: strOrNull(input.name),
    slug,
    description: strOrNull(input.description),
    featured_image_url: strOrNull(input.featured_image_url),
    images_urls: normalizeUrlArray(input.images_urls),
    process_image_urls: normalizeUrlArray(input.process_image_urls),
    process_images_label: strOrNull(input.process_images_label),
    process_and_context_html: input.process_and_context_html ?? '',
    year: strOrNull(input.year),
    linked_document_url: strOrNull(input.linked_document_url),
    video_url: strOrNull(input.video_url),
    fallback_writing_url: strOrNull(input.fallback_writing_url),
    project_type_id: projectTypeId || null,
    draft: Boolean(input.draft),
    archived: Boolean(input.archived),
  };

  if (data.process_and_context_html && data.process_and_context_html.length > 50000) {
    errors.process_and_context_html = 'Process HTML is too long.';
  }

  return {
    data,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}

