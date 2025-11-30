import type { SupabaseClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      project_types: {
        Row: {
          archived: boolean;
          category: string | null;
          created_at: string | null;
          font_awesome_icon: string | null;
          id: string;
          landing_page_credentials: string | null;
          name: string | null;
          slug: string;
          updated_at: string | null;
          draft: boolean;
        };
        Insert: {
          archived?: boolean;
          category?: string | null;
          created_at?: string | null;
          font_awesome_icon?: string | null;
          id?: string;
          landing_page_credentials?: string | null;
          name?: string | null;
          slug: string;
          updated_at?: string | null;
          draft?: boolean;
        };
        Update: {
          archived?: boolean;
          category?: string | null;
          created_at?: string | null;
          font_awesome_icon?: string | null;
          id?: string;
          landing_page_credentials?: string | null;
          name?: string | null;
          slug?: string;
          updated_at?: string | null;
          draft?: boolean;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          archived: boolean;
          created_at: string | null;
          description: string | null;
          draft: boolean;
          fallback_writing_url: string | null;
          featured_image_url: string | null;
          id: string;
          images_urls: string[] | null;
          linked_document_url: string | null;
          name: string | null;
          process_and_context_html: string | null;
          process_image_urls: string[] | null;
          process_images_label: string | null;
          project_type_id: string | null;
          slug: string;
          updated_at: string | null;
          video_url: string | null;
          year: string | null;
          published_on: string | null;
        };
        Insert: {
          archived?: boolean;
          created_at?: string | null;
          description?: string | null;
          draft?: boolean;
          fallback_writing_url?: string | null;
          featured_image_url?: string | null;
          id?: string;
          images_urls?: string[] | null;
          linked_document_url?: string | null;
          name?: string | null;
          process_and_context_html?: string | null;
          process_image_urls?: string[] | null;
          process_images_label?: string | null;
          project_type_id?: string | null;
          slug: string;
          updated_at?: string | null;
          video_url?: string | null;
          year?: string | null;
          published_on?: string | null;
        };
        Update: {
          archived?: boolean;
          created_at?: string | null;
          description?: string | null;
          draft?: boolean;
          fallback_writing_url?: string | null;
          featured_image_url?: string | null;
          id?: string;
          images_urls?: string[] | null;
          linked_document_url?: string | null;
          name?: string | null;
          process_and_context_html?: string | null;
          process_image_urls?: string[] | null;
          process_images_label?: string | null;
          project_type_id?: string | null;
          slug?: string;
          updated_at?: string | null;
          video_url?: string | null;
          year?: string | null;
          published_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_project_type_id_fkey';
            columns: ['project_type_id'];
            referencedRelation: 'project_types';
            referencedColumns: ['id'];
          },
        ];
      };
      articles: {
        Row: {
          archived: boolean;
          created_at: string | null;
          date_published: string | null;
          draft: boolean;
          featured_image_url: string | null;
          id: string;
          name: string | null;
          publication: string | null;
          slug: string;
          title: string | null;
          updated_at: string | null;
          url: string | null;
        };
        Insert: {
          archived?: boolean;
          created_at?: string | null;
          date_published?: string | null;
          draft?: boolean;
          featured_image_url?: string | null;
          id?: string;
          name?: string | null;
          publication?: string | null;
          slug: string;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Update: {
          archived?: boolean;
          created_at?: string | null;
          date_published?: string | null;
          draft?: boolean;
          featured_image_url?: string | null;
          id?: string;
          name?: string | null;
          publication?: string | null;
          slug?: string;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
      hero_content: {
        Row: {
          id: string;
          window_title: string;
          hero_text: string;
          hero_image_url: string;
          footer_link_text: string | null;
          footer_link_href: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          window_title?: string;
          hero_text: string;
          hero_image_url: string;
          footer_link_text?: string | null;
          footer_link_href?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          window_title?: string;
          hero_text?: string;
          hero_image_url?: string;
          footer_link_text?: string | null;
          footer_link_href?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      folder_links: {
        Row: {
          id: string;
          label: string;
          icon: string;
          href: string;
          external: boolean;
          display_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          label: string;
          icon?: string;
          href: string;
          external?: boolean;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          icon?: string;
          href?: string;
          external?: boolean;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TypedSupabaseClient = SupabaseClient<Database>;
