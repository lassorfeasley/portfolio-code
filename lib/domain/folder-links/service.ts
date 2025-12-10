import { ApiError } from '@/lib/api/errors';
import type { TypedSupabaseClient } from '@/lib/supabase/types';
import type { PostgrestError } from '@supabase/supabase-js';
import type { FolderLink, FolderLinkRow, FolderLinkPayload } from './types';
import { mergeLinksWithDefaults } from './defaults';

// type FolderLinkUpdate = Database['public']['Tables']['folder_links']['Update'];
// type FolderLinkInsert = Database['public']['Tables']['folder_links']['Insert'];

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

export async function getFolderLinks(
  client: TypedSupabaseClient
): Promise<FolderLink[]> {
  try {
    const links = await listFolderLinks(client);
    return mergeLinksWithDefaults(links);
  } catch (error) {
    console.error('Error fetching folder links:', error);
    // If DB fetch fails, return defaults
    return mergeLinksWithDefaults(null);
  }
}

export async function listFolderLinks(
  client: TypedSupabaseClient
): Promise<FolderLink[]> {
  const { data, error } = await client
    .from('folder_links')
    .select('*')
    .order('display_order', { ascending: true })
    .returns<FolderLinkRow[]>();

  if (error) {
    throw new ApiError('Failed to load folder links', 500, error.message);
  }

  // Debug: Log raw database data
  console.log('🔍 listFolderLinks - Raw DB data:', data);
  if (data) {
    data.forEach((row, index) => {
      console.log(`🔍 listFolderLinks - Raw DB Row ${index}:`, {
        id: row.id,
        label: row.label,
        icon: row.icon,
        iconType: typeof row.icon,
        iconLength: row.icon?.length,
        iconCharCodes: row.icon ? Array.from(row.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
        iconJSON: JSON.stringify(row.icon),
        href: row.href,
        external: row.external,
        display_order: row.display_order,
      });
    });
  }

  const folderLinks = (data ?? []).map(toFolderLink);
  
  // Debug: Log converted folder links
  console.log('🔍 listFolderLinks - Converted folder links:', folderLinks);
  folderLinks.forEach((link, index) => {
    console.log(`🔍 listFolderLinks - Converted Link ${index}:`, {
      id: link.id,
      label: link.label,
      icon: link.icon,
      iconType: typeof link.icon,
      iconLength: link.icon?.length,
      iconCharCodes: link.icon ? Array.from(link.icon).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`) : null,
      iconJSON: JSON.stringify(link.icon),
    });
  });

  return folderLinks;
}

export async function updateFolderLink(
  client: TypedSupabaseClient,
  id: string,
  payload: FolderLinkPayload
): Promise<FolderLinkRow> {
  const { data, error } = await (client
    .from('folder_links')
    .update({
      label: payload.label,
      icon: payload.icon,
      href: payload.href,
      external: payload.external,
      display_order: payload.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single() as unknown as Promise<{ data: FolderLinkRow; error: PostgrestError | null }>);

  if (error) {
    throw new ApiError('Failed to update folder link', 500, error.message);
  }

  return data;
}

export async function createFolderLink(
  client: TypedSupabaseClient,
  payload: FolderLinkPayload
): Promise<FolderLinkRow> {
  const { data, error } = await (client
    .from('folder_links')
    .insert({
      label: payload.label,
      icon: payload.icon,
      href: payload.href,
      external: payload.external,
      display_order: payload.displayOrder,
    })
    .select()
    .single() as unknown as Promise<{ data: FolderLinkRow; error: PostgrestError | null }>);

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
