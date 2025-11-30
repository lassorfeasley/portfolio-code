import { describe, expect, beforeEach, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import { POST } from './route';

vi.hoisted(() => {
  process.env.ADMIN_UPLOAD_BUCKET = 'projects';
  process.env.ADMIN_UPLOAD_BUCKETS = 'projects,assets';
  process.env.ADMIN_UPLOAD_MAX_BYTES = (1024 * 1024).toString(); // 1MB
});

const requireAdminSessionMock = vi.fn();
const supabaseServiceRoleMock = vi.fn();
const uploadFileToBucketMock = vi.fn();

vi.mock('@/lib/auth/admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseServiceRole: supabaseServiceRoleMock,
}));

vi.mock('@/lib/domain/uploads/service', () => ({
  uploadFileToBucket: uploadFileToBucketMock,
}));

vi.mock('@/lib/utils/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
}));

const MAX_BYTES = 1024 * 1024;

if (typeof globalThis.File === 'undefined') {
  class PolyfillFile {
    size: number;
    name: string;
    type: string;
    constructor(parts: (string | ArrayBuffer)[], name: string, options?: { type?: string }) {
      this.name = name;
      this.type = options?.type ?? 'application/octet-stream';
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') return acc + part.length;
        if (part instanceof ArrayBuffer) return acc + part.byteLength;
        return acc;
      }, 0);
    }
  }
  // @ts-expect-error - provide File polyfill for Node test environment
  globalThis.File = PolyfillFile;
}

function createFile(name = 'test.png', size = 512, type = 'image/png') {
  const content = 'a'.repeat(size);
  return new File([content], name, { type });
}

function createRequestStub(options: {
  file?: File | null;
  bucket?: string | null;
  prefix?: string | null;
} = {}) {
  const formData = {
    get: (key: string) => {
      if (key === 'file') return options.file ?? createFile();
      if (key === 'bucket') return options.bucket ?? null;
      if (key === 'prefix') return options.prefix ?? null;
      return null;
    },
  };
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

describe('admin uploads API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseServiceRoleMock.mockReturnValue({});
  });

  it('uploads file to default bucket when payload valid', async () => {
    const uploaded = { publicUrl: 'https://example.com/file.png' };
    uploadFileToBucketMock.mockResolvedValue(uploaded);

    const request = createRequestStub({ prefix: 'foo/bar' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(uploaded);
    expect(requireAdminSessionMock).toHaveBeenCalled();
    expect(uploadFileToBucketMock).toHaveBeenCalledWith(
      expect.anything(),
      'projects',
      expect.stringMatching(/\.png$/),
      expect.any(File)
    );
  });

  it('rejects uploads to disallowed buckets', async () => {
    const request = createRequestStub({ bucket: 'forbidden' });

    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Bucket is not allowed.',
      details: null,
    });
    expect(uploadFileToBucketMock).not.toHaveBeenCalled();
  });

  it('rejects when file is missing', async () => {
    const request = createRequestStub({ file: null });

    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'File is required.',
      details: null,
    });
  });

  it('rejects when file exceeds size limit', async () => {
    const largeFile = createFile('huge.mov', 1);
    Object.defineProperty(largeFile, 'size', { value: MAX_BYTES + 1 });
    const request = createRequestStub({ file: largeFile });

    const response = await POST(request);
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: 'File exceeds 1MB limit.',
      details: null,
    });
  });

  it('propagates unexpected errors from upload service', async () => {
    uploadFileToBucketMock.mockRejectedValue(new Error('storage unavailable'));
    const request = createRequestStub();

    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unexpected error' });
  });
});
