import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type ArticleRow = Tables['articles']['Row'];
export type ArticleInsert = Tables['articles']['Insert'];
export type ArticleUpdate = Tables['articles']['Update'];

export type ArticleSummary = Pick<
  ArticleRow,
  'id' | 'name' | 'slug' | 'title' | 'publication' | 'date_published' | 'featured_image_url' | 'project_id' | 'url'
>;
