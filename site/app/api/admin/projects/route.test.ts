import { describe, expect, beforeEach, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import { GET, POST } from './route';

const requireAdminSessionMock = vi.fn();
const supabaseServiceRoleMock = vi.fn();
const listAdminProjectsMock = vi.fn();
const createProjectMock = vi.fn();
const validateProjectPayloadMock = vi.fn();

vi.mock('@/lib/auth/admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseServiceRole: supabaseServiceRoleMock,
}));

vi.mock('@/lib/domain/projects/service', () => ({
  listAdminProjects: listAdminProjectsMock,
  createProject: createProjectMock,
}));

vi.mock('@/lib/validators/projects', () => ({
  validateProjectPayload: validateProjectPayloadMock,
}));

vi.mock('@/lib/utils/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}));

describe('admin projects API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseServiceRoleMock.mockReturnValue({}); // default client stub
  });

  describe('GET', () => {
    it('returns projects when session is valid', async () => {
      const projects = [{ id: '1', name: 'Sample' }];
      listAdminProjectsMock.mockResolvedValue(projects);

      const response = await GET();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ projects });
      expect(requireAdminSessionMock).toHaveBeenCalled();
      expect(listAdminProjectsMock).toHaveBeenCalled();
    });

    it('propagates ApiError from session guard', async () => {
      const authError = new ApiError('Forbidden', 403);
      requireAdminSessionMock.mockRejectedValue(authError);

      const response = await GET();
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: 'Forbidden',
        details: null,
      });
    });
  });

  describe('POST', () => {
    const requestPayload = { slug: 'test-project' };
    const sanitizedPayload = { slug: 'test-project', name: 'Test', draft: true };

    function createRequestStub(payload: unknown) {
      return {
        json: vi.fn().mockResolvedValue(payload),
      } as unknown as NextRequest;
    }

    it('creates a project when payload is valid', async () => {
      validateProjectPayloadMock.mockReturnValue({ data: sanitizedPayload, errors: null });
      const createdProject = { id: '1', ...sanitizedPayload };
      createProjectMock.mockResolvedValue(createdProject);
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(createdProject);
      expect(validateProjectPayloadMock).toHaveBeenCalledWith(requestPayload);
      expect(createProjectMock).toHaveBeenCalledWith(expect.anything(), sanitizedPayload);
    });

    it('returns validation error when payload is invalid', async () => {
      const validationErrors = { slug: 'required' };
      validateProjectPayloadMock.mockReturnValue({ data: null, errors: validationErrors });
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Validation failed',
        details: validationErrors,
      });
      expect(createProjectMock).not.toHaveBeenCalled();
    });

    it('returns unexpected error when creation fails', async () => {
      validateProjectPayloadMock.mockReturnValue({ data: sanitizedPayload, errors: null });
      createProjectMock.mockRejectedValue(new Error('DB down'));
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'Unexpected error',
      });
    });
  });
});
