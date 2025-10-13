import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In local dev without env vars, return an empty map rather than 500
    return NextResponse.json({}, { status: 200 });
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('projects')
    .select('slug, project_types!inner(slug)')
    .eq('draft', false)
    .eq('archived', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RowLike = { slug: string; project_types?: unknown };
  const hasSlug = (value: unknown): value is { slug: string } => {
    if (typeof value !== 'object' || value === null) return false;
    const slug = (value as Record<string, unknown>).slug;
    return typeof slug === 'string';
  };

  const extractProjectTypeSlug = (rel: unknown): string | undefined => {
    if (Array.isArray(rel)) {
      const first = rel[0];
      return hasSlug(first) ? first.slug : undefined;
    }
    return hasSlug(rel) ? rel.slug : undefined;
  };

  const isRowLike = (value: unknown): value is RowLike => {
    if (typeof value !== 'object' || value === null) return false;
    const slug = (value as Record<string, unknown>).slug;
    return typeof slug === 'string';
  };

  const map: Record<string, string> = {};
  const rows = Array.isArray(data) ? data : [];
  for (const item of rows) {
    if (!isRowLike(item)) continue;
    map[item.slug] = extractProjectTypeSlug(item.project_types) ?? '';
  }

  return NextResponse.json(map, { status: 200 });
}
