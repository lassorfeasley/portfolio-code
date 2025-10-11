import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('projects')
    .select('slug, project_types!inner(slug)')
    .eq('draft', false)
    .eq('archived', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { slug: string; project_types: { slug: string } | null };
  const map: Record<string, string> = {};
  (data as Row[] | null)?.forEach((row) => {
    map[row.slug] = row.project_types?.slug ?? '';
  });

  return NextResponse.json(map, { status: 200 });
}


