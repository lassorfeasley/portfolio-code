import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type FolderLinkRow = Tables['folder_links']['Row'];

export type FolderLink = {
  id: string;
  label: string;
  icon: string;
  href: string;
  external: boolean;
  displayOrder: number;
};

export type FolderLinkPayload = {
  label: string;
  icon: string;
  href: string;
  external: boolean;
  displayOrder: number;
};

