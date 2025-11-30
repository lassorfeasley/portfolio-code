import { describe, expect, it, vi } from 'vitest';
import {
  buildProjectSlugTypeMap,
  getPublishedProjectBySlug,
  listPublishedProjects,
} from '@/lib/domain/projects/service';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import { ApiError, NotFoundError } from '@/lib/api/errors';
import { createProjectRow, createProjectTypeRow } from '@/lib/test-utils';

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

  it('listPublishedProjects throws ApiError when query fails', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    };
    const mockClient = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    await expect(listPublishedProjects(mockClient)).rejects.toBeInstanceOf(ApiError);
  });

  it('getPublishedProjectBySlug returns detail data', async () => {
    const mockType = createProjectTypeRow();
    const mockRow = {
      ...createProjectRow(),
      project_types: mockType,
    } as ProjectRow & { project_types: ProjectTypeRow };

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
    };
    const mockClient = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    const detail = await getPublishedProjectBySlug(mockClient, 'sample-project');
    expect(detail.name).toBe(mockRow.name);
    expect(detail.projectType?.slug).toBe(mockType.slug);
  });

  it('getPublishedProjectBySlug throws NotFoundError when record missing', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const mockClient = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    await expect(getPublishedProjectBySlug(mockClient, 'missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getPublishedProjectBySlug throws ApiError on query failure', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
    };
    const mockClient = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    await expect(getPublishedProjectBySlug(mockClient, 'slug')).rejects.toBeInstanceOf(ApiError);
  });
});
