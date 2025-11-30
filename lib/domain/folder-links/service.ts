import { ApiError } from '@/lib/api/errors';
import type { TypedSupabaseClient, Database } from '@/lib/supabase/types';
import type { FolderLink, FolderLinkRow, FolderLinkPayload } from './types';

type FolderLinkUpdate = Database['public']['Tables']['folder_links']['Update'];
type FolderLinkInsert = Database['public']['Tables']['folder_links']['Insert'];

function toFolderLink(row: FolderLinkRow): FolderLink {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    href: row.href,
    external: row.external,
    displayOrder: row.display_order,
  };
}

export async function listFolderLinks(
  client: TypedSupabaseClient
): Promise<FolderLink[]> {
  const { data, error } = await client
    .from('folder_links')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    throw new ApiError('Failed to load folder links', 500, error.message);
  }

  return (data ?? []).map(toFolderLink);
}

export async function updateFolderLink(
  client: TypedSupabaseClient,
  id: string,
  payload: FolderLinkPayload
): Promise<FolderLinkRow> {
  const { data, error } = await client
    .from('folder_links')
    .update({
      label: payload.label,
      icon: payload.icon,
      href: payload.href,
      external: payload.external,
      display_order: payload.displayOrder,
      updated_at: new Date().toISOString(),
    } as FolderLinkUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ApiError('Failed to update folder link', 500, error.message);
  }

  return data;
}

export async function createFolderLink(
  client: TypedSupabaseClient,
  payload: FolderLinkPayload
): Promise<FolderLinkRow> {
  const { data, error } = await client
    .from('folder_links')
    .insert({
      label: payload.label,
      icon: payload.icon,
      href: payload.href,
      external: payload.external,
      display_order: payload.displayOrder,
    } as FolderLinkInsert)
    .select()
    .single();

  if (error) {
    throw new ApiError('Failed to create folder link', 500, error.message);
  }

  return data;
}

export async function deleteFolderLink(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from('folder_links')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ApiError('Failed to delete folder link', 500, error.message);
  }
}

