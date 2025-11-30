import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];

export type HeroContentRow = Tables['hero_content']['Row'];

export type HeroContent = {
  id: string;
  windowTitle: string;
  heroText: string;
  heroImageUrl: string;
  footerLinkText: string | null;
  footerLinkHref: string | null;
};

export type HeroContentPayload = {
  windowTitle: string;
  heroText: string;
  heroImageUrl: string;
  footerLinkText: string | null;
  footerLinkHref: string | null;
};

