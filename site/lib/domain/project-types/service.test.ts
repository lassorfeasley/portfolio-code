import { describe, expect, it, vi } from 'vitest';
import {
  createProjectType,
  deleteProjectType,
  listPublishedProjectTypes,
} from '@/lib/domain/project-types/service';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import { ApiError } from '@/lib/api/errors';

function createClient(builderSequence: unknown[]): TypedSupabaseClient {
  const fromMock = vi.fn();
  builderSequence.forEach((builder) => {
    fromMock.mockReturnValueOnce(builder);
  });
  return { from: fromMock } as unknown as TypedSupabaseClient;
}

describe('project-types service', () => {
  it('listPublishedProjectTypes maps summaries', async () => {
    const row = {
      id: 'type-1',
      name: 'Interaction',
      slug: 'interaction',
      category: 'Design',
      landing_page_credentials: 'Credentials',
      font_awesome_icon: '',
      draft: false,
      archived: false,
      created_at: null,
      updated_at: null,
    };
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [row], error: null }),
    };
    const client = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    const summaries = await listPublishedProjectTypes(client);
    expect(summaries).toEqual([
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
      },
    ]);
  });

  it('listPublishedProjectTypes throws when query fails', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    };
    const client = { from: vi.fn(() => builder) } as unknown as TypedSupabaseClient;

    await expect(listPublishedProjectTypes(client)).rejects.toBeInstanceOf(ApiError);
  });

  it('createProjectType inserts when slug available', async () => {
    const createdRow = {
      id: 'type-1',
      name: 'Interaction',
      slug: 'interaction',
      category: null,
      landing_page_credentials: null,
      font_awesome_icon: null,
      draft: false,
      archived: false,
      created_at: null,
      updated_at: null,
    };
    const slugBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: createdRow, error: null }),
    };
    const client = createClient([slugBuilder, insertBuilder]);

    const result = await createProjectType(client, {
      id: undefined,
      name: 'Interaction',
      slug: 'interaction',
      category: null,
      draft: false,
      archived: false,
    });
    expect(result).toEqual(createdRow);
  });

  it('createProjectType rejects when slug already exists', async () => {
    const slugBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'type-1' }, error: null }),
    };
    const client = createClient([slugBuilder]);

    await expect(
      createProjectType(client, {
        id: undefined,
        name: 'Interaction',
        slug: 'interaction',
        category: null,
        draft: false,
        archived: false,
      })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('deleteProjectType throws when delete fails', async () => {
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'boom' }, count: null }),
    };
    const client = { from: vi.fn(() => deleteBuilder) } as unknown as TypedSupabaseClient;

    await expect(deleteProjectType(client, 'type-1')).rejects.toBeInstanceOf(ApiError);
  });

  it('deleteProjectType throws NotFound when no rows deleted', async () => {
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
    };
    const client = { from: vi.fn(() => deleteBuilder) } as unknown as TypedSupabaseClient;

    await expect(deleteProjectType(client, 'missing')).rejects.toThrow('Project type not found');
  });
});
