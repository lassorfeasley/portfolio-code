import type { NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdminSession } from '@/lib/auth/admin';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';

const MAX_FILE_SIZE = Number(process.env.ADMIN_UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);
const ALLOWED_PATHNAME = /^projects(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdminSession();
        if (!ALLOWED_PATHNAME.test(pathname)) {
          throw new ApiError('Upload path is not allowed.', 400);
        }
        return {
          allowedContentTypes: ['image/*'],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
        };
      },
    });

    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
