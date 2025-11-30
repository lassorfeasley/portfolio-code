import { describe, expect, it, vi } from 'vitest';
import {
  buildProjectSlugTypeMap,
  listPublishedProjects,
} from '@/lib/domain/projects/service';
import type { ProjectRow, ProjectTypeRow } from '@/lib/domain/projects/types';
import type { TypedSupabaseClient } from '@/lib/supabase/types';

function createProjectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
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

function createProjectTypeRow(
  overrides: Partial<ProjectTypeRow> = {}
): ProjectTypeRow {
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

describe('projects service', () => {
  it('listPublishedProjects returns summaries with project type metadata', async () => {
    const mockType = createProjectTypeRow();
    const mockRow = createProjectRow({
      project_types: mockType,
    }) as ProjectRow & { project_types: ProjectTypeRow };

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockRow], error: null }),
    };

    const mockClient = {
      from: vi.fn(() => builder),
    } as unknown as TypedSupabaseClient;

    const result = await listPublishedProjects(mockClient);

    expect(result).toEqual([
      {
        id: mockRow.id,
        name: mockRow.name,
        slug: mockRow.slug,
        description: mockRow.description,
        featured_image_url: mockRow.featured_image_url,
        year: mockRow.year,
        projectType: {
          id: mockType.id,
          name: mockType.name,
          slug: mockType.slug,
          category: mockType.category,
          landing_page_credentials: mockType.landing_page_credentials,
          font_awesome_icon: mockType.font_awesome_icon,
        },
      },
    ]);
    expect(mockClient.from).toHaveBeenCalledWith('projects');
  });

  it('buildProjectSlugTypeMap constructs a slug → type map', async () => {
    const mockType = createProjectTypeRow({ slug: 'design' });
    const mockRow = {
      ...createProjectRow({ slug: 'sample-project' }),
      project_types: [mockType],
    };

    let eqCalls = 0;
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(() => {
        eqCalls += 1;
        return eqCalls < 2
          ? builder
          : Promise.resolve({ data: [mockRow], error: null });
      }),
    };

    const mockClient = {
      from: vi.fn(() => builder),
    } as unknown as TypedSupabaseClient;

    const map = await buildProjectSlugTypeMap(mockClient);

    expect(map).toEqual({ 'sample-project': 'design' });
    expect(mockClient.from).toHaveBeenCalledWith('projects');
  });
});
