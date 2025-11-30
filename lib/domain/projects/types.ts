import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type ProjectRow = Tables['projects']['Row'];
export type ProjectInsert = Tables['projects']['Insert'];
export type ProjectUpdate = Tables['projects']['Update'];
export type ProjectTypeRow = Tables['project_types']['Row'];

export type ProjectWithTypeRelation = ProjectRow & {
  project_types?: ProjectTypeRow | ProjectTypeRow[] | null;
};

export type ProjectTypeSummary = Pick<ProjectTypeRow, 'id' | 'name' | 'slug' | 'category'> & {
  landing_page_credentials?: string | null;
  font_awesome_icon?: string | null;
};

export type ProjectSummary = Pick<
  ProjectRow,
  'id' | 'name' | 'slug' | 'description' | 'featured_image_url' | 'year'
> & {
  projectType: Pick<ProjectTypeRow, 'id' | 'name' | 'slug'> | null;
};

export type ProjectDetail = ProjectRow & {
  projectType: ProjectTypeSummary | null;
};

export type ProjectSlugTypeMap = Record<string, string>;
