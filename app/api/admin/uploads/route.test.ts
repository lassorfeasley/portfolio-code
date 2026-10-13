import { describe, expect, beforeEach, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from './route';
import { UnauthorizedError } from '@/lib/api/errors';

const { requireAdminSessionMock, handleUploadMock } = vi.hoisted(() => {
  process.env.ADMIN_UPLOAD_MAX_BYTES = (1024 * 1024).toString(); // 1MB
  return { requireAdminSessionMock: vi.fn(), handleUploadMock: vi.fn() };
});

vi.mock('@/lib/auth/admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock('@vercel/blob/client', () => ({
  handleUpload: handleUploadMock,
}));

vi.mock('@/lib/utils/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}));

type TokenCallback = (pathname: string) => Promise<Record<string, unknown>>;

function createRequestStub(body: unknown = { type: 'blob.generate-client-token' }) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function mockHandleUploadFor(pathname: string) {
  handleUploadMock.mockImplementation(
    async ({ onBeforeGenerateToken }: { onBeforeGenerateToken: TokenCallback }) => {
      const options = await onBeforeGenerateToken(pathname);
      return { type: 'blob.generate-client-token', clientToken: 'token', options };
    }
  );
}

describe('admin uploads API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminSessionMock.mockResolvedValue({});
  });

  it('issues an image-only upload token for admins', async () => {
    mockHandleUploadFor('projects/my-project/final/123-abc.png');

    const response = await POST(createRequestStub());

    expect(response.status).toBe(200);
    expect(requireAdminSessionMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      type: 'blob.generate-client-token',
      clientToken: 'token',
      options: {
        allowedContentTypes: ['image/*'],
        maximumSizeInBytes: 1024 * 1024,
        addRandomSuffix: false,
      },
    });
  });

  it('rejects token requests from non-admins', async () => {
    requireAdminSessionMock.mockRejectedValue(new UnauthorizedError('Sign in to continue.'));
    mockHandleUploadFor('projects/my-project/final/123-abc.png');

    const response = await POST(createRequestStub());

    expect(response.status).toBe(401);
  });

  it.each([
    'other/file.png',
    'projects/../secrets.png',
    'projects/.hidden/file.png',
    'projects',
  ])('rejects disallowed pathname %s', async (pathname) => {
    mockHandleUploadFor(pathname);

    const response = await POST(createRequestStub());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Upload path is not allowed.',
      details: null,
    });
  });

  it('propagates unexpected errors from the blob client', async () => {
    handleUploadMock.mockRejectedValue(new Error('blob unavailable'));

    const response = await POST(createRequestStub());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unexpected error' });
  });
});
