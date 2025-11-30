import { describe, expect, beforeEach, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import { GET, POST } from './route';

const requireAdminSessionMock = vi.fn();
const supabaseServiceRoleMock = vi.fn();
const listAdminProjectTypesMock = vi.fn();
const createProjectTypeMock = vi.fn();
const validateProjectTypePayloadMock = vi.fn();

vi.mock('@/lib/auth/admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseServiceRole: supabaseServiceRoleMock,
}));

vi.mock('@/lib/domain/project-types/service', () => ({
  listAdminProjectTypes: listAdminProjectTypesMock,
  createProjectType: createProjectTypeMock,
}));

vi.mock('@/lib/validators/project-types', () => ({
  validateProjectTypePayload: validateProjectTypePayloadMock,
}));

vi.mock('@/lib/utils/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}));

describe('admin project-types API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseServiceRoleMock.mockReturnValue({});
  });

  describe('GET', () => {
    it('returns project types for valid session', async () => {
      const projectTypes = [{ id: 'type-1', name: 'Interaction' }];
      listAdminProjectTypesMock.mockResolvedValue(projectTypes);

      const response = await GET();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ projectTypes });
      expect(requireAdminSessionMock).toHaveBeenCalled();
      expect(listAdminProjectTypesMock).toHaveBeenCalled();
    });

    it('returns ApiError details when session fails', async () => {
      const authError = new ApiError('Unauthorized', 401);
      requireAdminSessionMock.mockRejectedValue(authError);

      const response = await GET();
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: 'Unauthorized',
        details: null,
      });
    });
  });

  describe('POST', () => {
    const requestPayload = { slug: 'interaction', name: 'Interaction Design' };
    const sanitizedPayload = { ...requestPayload, draft: false };

    function createRequestStub(payload: unknown) {
      return {
        json: vi.fn().mockResolvedValue(payload),
      } as unknown as NextRequest;
    }

    it('creates project type for valid payload', async () => {
      validateProjectTypePayloadMock.mockReturnValue({ data: sanitizedPayload, errors: null });
      const createdType = { id: 'type-1', ...sanitizedPayload };
      createProjectTypeMock.mockResolvedValue(createdType);
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(createdType);
      expect(validateProjectTypePayloadMock).toHaveBeenCalledWith(requestPayload);
      expect(createProjectTypeMock).toHaveBeenCalledWith(expect.anything(), sanitizedPayload);
    });

    it('returns validation errors when payload invalid', async () => {
      const validationErrors = { slug: 'required' };
      validateProjectTypePayloadMock.mockReturnValue({ data: null, errors: validationErrors });
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'Validation failed',
        details: validationErrors,
      });
      expect(createProjectTypeMock).not.toHaveBeenCalled();
    });

    it('returns unexpected error when creation throws', async () => {
      validateProjectTypePayloadMock.mockReturnValue({ data: sanitizedPayload, errors: null });
      createProjectTypeMock.mockRejectedValue(new Error('DB error'));
      const request = createRequestStub(requestPayload);

      const response = await POST(request);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Unexpected error' });
    });
  });
});
