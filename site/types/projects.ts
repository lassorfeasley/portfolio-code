export type ProjectRecord = {
  id: string;
  name: string | null;
  slug: string;
  description: string | null;
  featured_image_url: string | null;
  images_urls: string[] | null;
  process_image_urls: string[] | null;
  process_images_label: string | null;
  process_and_context_html: string | null;
  year: string | null;
  linked_document_url: string | null;
  video_url: string | null;
  fallback_writing_url: string | null;
  project_type_id: string | null;
  draft: boolean;
  archived: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProjectTypeRecord = {
  id: string;
  name: string | null;
  slug: string;
  category: string | null;
  draft: boolean;
  archived: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProjectTypePayload = Omit<ProjectTypeRecord, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ProjectPayload = Omit<ProjectRecord, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ProjectWritePayload = Omit<ProjectRecord, 'id' | 'created_at' | 'updated_at'>;

