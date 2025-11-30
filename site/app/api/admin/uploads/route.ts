import type { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { ApiError } from '@/lib/api/errors';
import { handleApiError, json } from '@/lib/api/response';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { uploadFileToBucket } from '@/lib/domain/uploads/service';

const defaultBucket = process.env.ADMIN_UPLOAD_BUCKET || 'projects';
const allowedBuckets = (process.env.ADMIN_UPLOAD_BUCKETS || defaultBucket)
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const effectiveDefaultBucket = allowedBuckets[0] ?? defaultBucket;
const MAX_FILE_SIZE = Number(process.env.ADMIN_UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);

function sanitizePrefix(raw: string | null): string {
  if (!raw) return '';
  return raw.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+|\/+$/g, '');
}

function buildObjectPath(prefix: string, filename: string): string {
  const safePrefix = sanitizePrefix(prefix);
  const extension = filename.includes('.') ? filename.split('.').pop() ?? 'bin' : 'bin';
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return [safePrefix, `${slug}.${extension.toLowerCase()}`].filter(Boolean).join('/');
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ApiError('File is required.', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(`File exceeds ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit.`, 413);
    }

    const bucketParam = (formData.get('bucket') ?? effectiveDefaultBucket).toString();
    if (!allowedBuckets.includes(bucketParam)) {
      throw new ApiError('Bucket is not allowed.', 400);
    }

    const prefix = formData.get('prefix')?.toString() ?? '';
    const objectPath = buildObjectPath(prefix, file.name);

    const adminClient = supabaseServiceRole();
    const uploaded = await uploadFileToBucket(adminClient, bucketParam, objectPath, file);

    return json(uploaded);
  } catch (error) {
    return handleApiError(error);
  }
}



