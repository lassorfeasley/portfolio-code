import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type ProjectTypeRow = Tables['project_types']['Row'];
export type ProjectTypeInsert = Tables['project_types']['Insert'];
export type ProjectTypeUpdate = Tables['project_types']['Update'];

export type ProjectTypeSummary = Pick<ProjectTypeRow, 'id' | 'name' | 'slug' | 'category'>;

export type ProjectTypeDetail = ProjectTypeSummary & {
  landing_page_credentials: string | null;
  font_awesome_icon: string | null;
  draft: boolean;
  archived: boolean;
};
