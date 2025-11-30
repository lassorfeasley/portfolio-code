import { ApiError } from '@/lib/api/errors';
import type { TypedSupabaseClient, Database } from '@/lib/supabase/types';
import type { HeroContent, HeroContentRow, HeroContentPayload } from './types';

type HeroContentUpdate = Database['public']['Tables']['hero_content']['Update'];

function toHeroContent(row: HeroContentRow): HeroContent {
  return {
    id: row.id,
    windowTitle: row.window_title,
    heroText: row.hero_text,
    heroImageUrl: row.hero_image_url,
    footerLinkText: row.footer_link_text,
    footerLinkHref: row.footer_link_href,
  };
}

export async function getHeroContent(
  client: TypedSupabaseClient
): Promise<HeroContent | null> {
  const { data, error } = await client
    .from('hero_content')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw new ApiError('Failed to load hero content', 500, error.message);
  }

  return data ? toHeroContent(data) : null;
}

export async function updateHeroContent(
  client: TypedSupabaseClient,
  id: string,
  payload: HeroContentPayload
): Promise<HeroContentRow> {
  const { data, error } = await client
    .from('hero_content')
    .update({
      window_title: payload.windowTitle,
      hero_text: payload.heroText,
      hero_image_url: payload.heroImageUrl,
      footer_link_text: payload.footerLinkText,
      footer_link_href: payload.footerLinkHref,
      updated_at: new Date().toISOString(),
    } as HeroContentUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ApiError('Failed to update hero content', 500, error.message);
  }

  return data;
}

