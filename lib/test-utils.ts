import type { ProjectRow, ProjectTypeRow } from '@/lib/domain/projects/types';

export function createProjectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'project-1',
    name: 'Sample Project',
    slug: 'sample-project',
    description: 'Example description',
    featured_image_url: 'https://example.com/featured.png',
    images_urls: ['https://example.com/final.png'],
    process_image_urls: ['https://example.com/process.png'],
    process_images_label: 'Process',
    process_and_context_html: '<p>Context</p>',
    year: '2024',
    linked_document_url: 'https://example.com/doc',
    video_url: null,
    fallback_writing_url: 'https://example.com/writeup',
    project_type_id: 'type-1',
    draft: false,
    archived: false,
    created_at: null,
    updated_at: null,
    published_on: '2024-01-01',
    ...overrides,
  };
}

export function createProjectTypeRow(overrides: Partial<ProjectTypeRow> = {}): ProjectTypeRow {
  return {
    id: 'type-1',
    name: 'Interaction design',
    slug: 'interaction-design',
    category: 'Design',
    landing_page_credentials: null,
    font_awesome_icon: null,
    draft: false,
    archived: false,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}
