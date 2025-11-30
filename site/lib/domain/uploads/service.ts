import { ApiError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';

export async function uploadFileToBucket(
  client: TypedSupabaseClient,
  bucket: string,
  objectPath: string,
  file: File,
  contentType?: string
) {
  const { error } = await client.storage.from(bucket).upload(objectPath, file, {
    upsert: false,
    contentType: contentType || file.type || 'application/octet-stream',
  });

  if (error) {
    throw new ApiError('Upload failed', 500, error.message);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return {
    bucket,
    path: objectPath,
    publicUrl: data.publicUrl,
  };
}
